"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Song } from "@/types";
import { electronAPI } from "@/libs/electron";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import SongItem from "@/components/Song/SongItem";
import Header from "@/components/Header/Header";
import usePlayer from "@/hooks/player/usePlayer";

const OfflinePage = () => {
  const router = useRouter();
  const { isOnline } = useNetworkStatus();
  const player = usePlayer();
  const [offlineSongs, setOfflineSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // オンライン時はホームにリダイレクト
  useEffect(() => {
    if (isOnline) {
      router.push("/");
    }
  }, [isOnline, router]);

  // オフライン曲の取得
  useEffect(() => {
    const fetchOfflineSongs = async () => {
      setIsLoading(true);
      try {
        if (electronAPI.isElectron()) {
          const songs = await electronAPI.offline.getSongs();
          // OfflineSong[] を Song[] にキャスト（構造が似ているため）
          setOfflineSongs(songs as unknown as Song[]);
        }
      } catch (error) {
        console.error("Failed to fetch offline songs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOfflineSongs();
  }, []);

  const handlePlay = (id: string) => {
    const song = offlineSongs.find((s) => s.id === id);
    if (!song) return;

    // プレイヤーに全オフライン曲をセット
    player.setIds(offlineSongs.map((s) => s.id));

    // 全てのオフライン曲をローカル曲として登録（IDはそのままで良い）
    offlineSongs.forEach((s) => {
      player.setLocalSong(s);
    });

    // 再生開始
    player.setId(id);
  };

  return (
    <div className="bg-neutral-900 rounded-lg h-full w-full overflow-hidden overflow-y-auto">
      <Header className="from-bg-neutral-900">
        <div className="mb-2 flex flex-col gap-y-6">
          <h1 className="text-white text-3xl font-semibold">Offline Mode</h1>
          <p className="text-neutral-400">
            You are currently offline. Access your downloaded music here.
          </p>
        </div>
      </Header>

      <div className="px-6 py-4">
        {isLoading ? (
          <div className="text-neutral-400">Loading downloaded songs...</div>
        ) : offlineSongs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 mt-10">
            <div className="text-neutral-400">No downloaded songs found.</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-8 gap-4 p-6">
            {offlineSongs.map((song) => (
              <SongItem key={song.id} data={song} onClick={handlePlay} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OfflinePage;
