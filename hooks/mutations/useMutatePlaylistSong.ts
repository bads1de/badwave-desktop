import { createClient } from "@/libs/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { CACHED_QUERIES } from "@/constants";
import { useUser } from "@/hooks/auth/useUser";
import { useRouter } from "next/navigation";
import { isElectron, cache as electronCache } from "@/libs/electron";

/**
 * プレイリスト曲の操作（追加・削除）を行うカスタムフック（ローカルファースト）
 *
 * @returns プレイリスト曲の操作関数
 */
const useMutatePlaylistSong = () => {
  const supabaseClient = createClient();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const router = useRouter();

  /**
   * プレイリストから曲を削除するミューテーション
   */
  const deletePlaylistSong = useMutation({
    mutationFn: async ({
      songId,
      playlistId,
    }: {
      songId: string;
      playlistId: string;
    }) => {
      if (typeof songId === "string" && songId.startsWith("local_")) {
        throw new Error("ローカル曲はプレイリストから削除できません");
      }

      if (!user?.id) {
        throw new Error("ユーザーが認証されていません");
      }

      // --- Step 1: ローカルDBから削除（即時反映）---
      if (isElectron()) {
        await electronCache.removePlaylistSong({ playlistId, songId });
      }

      // --- Step 2: Supabaseから削除（バックグラウンド）---
      try {
        const { error } = await supabaseClient
          .from("playlist_songs")
          .delete()
          .eq("playlist_id", playlistId)
          .eq("user_id", user.id)
          .eq("song_id", songId);

        if (error) {
          console.warn("[Playlist] Supabase delete failed:", error);
        }
      } catch (syncError) {
        console.warn("[Playlist] Supabase sync failed:", syncError);
      }

      return { songId, playlistId };
    },
    onSuccess: () => {
      // プレイリスト関連のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: [CACHED_QUERIES.playlists] });
      toast.success("プレイリストから曲が削除されました！");
      router.refresh();
    },
    onError: (error: Error) => {
      console.error("Error deleting song from playlist:", error);
      toast.error(error.message || "プレイリストから曲の削除に失敗しました");
    },
  });

  /**
   * プレイリストに曲を追加するミューテーション
   */
  const addPlaylistSong = useMutation({
    mutationFn: async ({
      songId,
      playlistId,
      songType = "regular",
      updateImagePath,
    }: {
      songId: string;
      playlistId: string;
      songType?: "regular";
      updateImagePath?: string;
    }) => {
      if (typeof songId === "string" && songId.startsWith("local_")) {
        throw new Error("ローカル曲はプレイリストに追加できません");
      }

      if (!user?.id) {
        throw new Error("ユーザーが認証されていません");
      }

      // --- Step 1: ローカルDBに追加（即時反映）---
      if (isElectron()) {
        await electronCache.addPlaylistSong({ playlistId, songId });
      }

      // --- Step 2: Supabaseに追加（バックグラウンド）---
      try {
        const { error } = await supabaseClient.from("playlist_songs").insert({
          playlist_id: playlistId,
          user_id: user.id,
          song_id: songId,
          song_type: songType,
        });

        if (error) {
          console.warn("[Playlist] Supabase insert failed:", error);
        }

        // プレイリストの画像を更新する必要がある場合
        if (updateImagePath && !error) {
          const { error: updateError } = await supabaseClient
            .from("playlists")
            .update({ image_path: updateImagePath })
            .eq("id", playlistId)
            .eq("user_id", user.id);

          if (updateError) {
            console.error("プレイリスト画像の更新エラー:", updateError);
          }
        }
      } catch (syncError) {
        console.warn("[Playlist] Supabase sync failed:", syncError);
      }

      return { songId, playlistId };
    },
    onSuccess: () => {
      // プレイリスト関連のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: [CACHED_QUERIES.playlists] });
      // プレイリスト曲の状態を無効化
      queryClient.invalidateQueries({ queryKey: ["playlistSongStatus"] });
      toast.success("プレイリストに曲が追加されました！");
    },
    onError: (error: Error) => {
      console.error("Error adding song to playlist:", error);
      toast.error(error.message || "プレイリストへの曲の追加に失敗しました");
    },
  });

  return {
    deletePlaylistSong,
    addPlaylistSong,
  };
};

export default useMutatePlaylistSong;
