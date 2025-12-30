import { createClient } from "@/libs/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { CACHED_QUERIES } from "@/constants";
import { isElectron, cache as electronCache } from "@/libs/electron";

/**
 * いいねカウント更新のヘルパー関数（Supabase用）
 */
const updateLikeCount = async (
  supabase: ReturnType<typeof createClient>,
  songId: string,
  increment: number
) => {
  try {
    // 現在のlike_countを取得
    const { data, error: fetchError } = await supabase
      .from("songs")
      .select("like_count")
      .eq("id", songId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // 新しいlike_countを計算して更新
    const newLikeCount = (data?.like_count || 0) + increment;
    const { error: updateError } = await supabase
      .from("songs")
      .update({ like_count: newLikeCount })
      .eq("id", songId);

    if (updateError) {
      throw updateError;
    }
  } catch (error) {
    console.error("Error updating like count:", error);
    throw new Error("いいねカウントの更新に失敗しました");
  }
};

/**
 * 曲のいいね操作を行うカスタムフック（ローカルファースト）
 *
 * @param songId 曲のID
 * @param userId ユーザーID
 * @returns いいね操作のミューテーション
 */
const useLikeMutation = (songId: string, userId?: string) => {
  const supabaseClient = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (isCurrentlyLiked: boolean) => {
      if (typeof songId === "string" && songId.startsWith("local_")) {
        throw new Error("ローカル曲にはいいねできません");
      }

      if (!userId) {
        throw new Error("ユーザーIDが必要です");
      }

      // --- Step 1: ローカルDBに書き込み（即時反映）---
      if (isElectron()) {
        if (isCurrentlyLiked) {
          await electronCache.removeLikedSong({ userId, songId });
        } else {
          await electronCache.addLikedSong({ userId, songId });
        }
      }

      // --- Step 2: Supabaseに同期（バックグラウンド）---
      // エラーでも続行、次回同期時に整合性が取れる
      try {
        if (isCurrentlyLiked) {
          // いいねを削除
          const { error } = await supabaseClient
            .from("liked_songs_regular")
            .delete()
            .eq("user_id", userId)
            .eq("song_id", songId);

          if (error) {
            console.warn("[Like] Supabase delete failed:", error);
          } else {
            // いいねカウントを減らす（成功時のみ）
            await updateLikeCount(supabaseClient, songId, -1).catch((e) =>
              console.warn("[Like] like_count update failed:", e)
            );
          }
        } else {
          // いいねを追加
          const { error } = await supabaseClient
            .from("liked_songs_regular")
            .insert({
              song_id: songId,
              user_id: userId,
            });

          if (error) {
            console.warn("[Like] Supabase insert failed:", error);
          } else {
            // いいねカウントを増やす（成功時のみ）
            await updateLikeCount(supabaseClient, songId, 1).catch((e) =>
              console.warn("[Like] like_count update failed:", e)
            );
          }
        }
      } catch (syncError) {
        console.warn(
          "[Like] Supabase sync failed, will retry later:",
          syncError
        );
        // オプション: 再試行キューに追加する処理をここに追加
      }

      return !isCurrentlyLiked;
    },
    onSuccess: (newLikeStatus) => {
      // いいね状態のキャッシュを更新
      queryClient.setQueryData(
        [CACHED_QUERIES.likeStatus, songId, userId],
        newLikeStatus
      );

      // 曲データのキャッシュを無効化（いいねカウントが変わるため）
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.songById, songId],
      });

      // トレンド曲のキャッシュを無効化（いいねカウントが変わるため）
      queryClient.invalidateQueries({ queryKey: [CACHED_QUERIES.trendSongs] });

      // いいね曲リストのキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: [CACHED_QUERIES.likedSongs] });

      if (newLikeStatus) {
        toast.success("いいねしました！");
      }
    },
    onError: (error) => {
      console.error("Like mutation error:", error);
      toast.error("エラーが発生しました。もう一度お試しください。");
    },
  });
};

export default useLikeMutation;
