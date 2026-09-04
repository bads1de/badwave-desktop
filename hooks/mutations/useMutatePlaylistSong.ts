import { createClient } from "@/libs/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { CACHED_QUERIES, TABLES } from "@/constants";
import type { Song } from "@/types";
import { useUser } from "@/hooks/auth/useUser";
import { getErrorMessage } from "@/libs/utils/error";
import { useRouter } from "next/navigation";
import { isElectron, cache as electronCache } from "@/libs/electron";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { ERROR_MESSAGES } from "@/constants/errorMessages";

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
  const { isOnline } = useNetworkStatus();

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

      // オフライン時は操作を許可しない
      if (!isOnline) {
        throw new Error("オフライン時はプレイリストの編集操作ができません");
      }

      // --- Step 1: ローカルDBから削除（IPC経由）---
      // オンライン時のみ、UX向上のためにローカルDBも更新しておく（これは同期的な整合性を保つため）
      if (isElectron()) {
        await electronCache.removePlaylistSong({ playlistId, songId });
      }

      // --- Step 2: Supabaseから削除（バックグラウンド）---
      try {
        const { error } = await supabaseClient
          .from(TABLES.PLAYLIST_SONGS)
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
    onMutate: async ({ songId, playlistId }) => {
      await queryClient.cancelQueries({
        queryKey: [CACHED_QUERIES.playlists, playlistId, "songs"],
      });

      const previousSongs = queryClient.getQueryData<Song[]>([
        CACHED_QUERIES.playlists,
        playlistId,
        "songs",
      ]);

      queryClient.setQueryData<Song[]>(
        [CACHED_QUERIES.playlists, playlistId, "songs"],
        (old) => (old || []).filter((s: Song) => s.id !== songId),
      );

      return { previousSongs, playlistId };
    },
    onSuccess: (_data, { playlistId }) => {
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.playlists, playlistId, "songs"],
      });
      queryClient.invalidateQueries({ queryKey: [CACHED_QUERIES.playlists] });
      toast.success("プレイリストから曲が削除されました！");
      router.refresh();
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousSongs !== undefined) {
        queryClient.setQueryData(
          [CACHED_QUERIES.playlists, context.playlistId, "songs"],
          context.previousSongs,
        );
      }
      console.error("Error deleting song from playlist:", error);
      toast.error(getErrorMessage(error, ERROR_MESSAGES.PLAYLIST_DELETE_SONG_FAILED));
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

      // オフライン時は操作を許可しない
      if (!isOnline) {
        throw new Error("オフライン時はプレイリストの編集操作ができません");
      }

      // --- Step 1: ローカルDBに追加（IPC経由）---
      // オンライン時のみ、UX向上のためにローカルDBも更新しておく（これは同期的な整合性を保つため）
      if (isElectron()) {
        await electronCache.addPlaylistSong({ playlistId, songId });
      }

      // --- Step 2: Supabaseに追加（バックグラウンド）---
      try {
        const { error } = await supabaseClient.from(TABLES.PLAYLIST_SONGS).insert({
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
            .from(TABLES.PLAYLISTS)
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
    onMutate: async ({ songId, playlistId }) => {
      await queryClient.cancelQueries({
        queryKey: [CACHED_QUERIES.playlists, playlistId, "songs"],
      });

      const previousSongs = queryClient.getQueryData<Song[]>([
        CACHED_QUERIES.playlists,
        playlistId,
        "songs",
      ]);

      queryClient.setQueryData<Song[]>(
        [CACHED_QUERIES.playlists, playlistId, "songs"],
        (old) => [
          ...(old || []),
          { id: songId, playlist_id: playlistId } as unknown as Song,
        ],
      );

      return { previousSongs, playlistId };
    },
    onSuccess: (_data, { playlistId }) => {
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.playlists, playlistId, "songs"],
      });
      queryClient.invalidateQueries({ queryKey: [CACHED_QUERIES.playlists] });
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.playlistSongStatus],
      });
      toast.success("プレイリストに曲が追加されました！");
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousSongs !== undefined) {
        queryClient.setQueryData(
          [CACHED_QUERIES.playlists, context.playlistId, "songs"],
          context.previousSongs,
        );
      }
      console.error("Error adding song to playlist:", error);
      toast.error(getErrorMessage(error, ERROR_MESSAGES.PLAYLIST_ADD_SONG_FAILED));
    },
  });

  return {
    deletePlaylistSong,
    addPlaylistSong,
  };
};

export default useMutatePlaylistSong;
