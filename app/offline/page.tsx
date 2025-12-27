"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { Song } from "@/types";
import { electronAPI } from "@/libs/electron-utils";
import SongItem from "@/components/Song/SongItem";
import Header from "@/components/Header/Header";

const OfflinePage = () => {
  const router = useRouter();
  const { isOnline } = useNetworkStatus();
  const [offlineSongs, setOfflineSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // オンラインに復帰したらホームに戻る
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
          // TODO: Implement getOfflineSongs in electron-utils and IPC
          // For now, assume it returns an array
          // const songs = await electronAPI.offline.getOfflineSongs();
          // setOfflineSongs(songs);

          // Placeholder logic until IPC is ready
          console.log("Fetching offline songs...");
        }
      } catch (error) {
        console.error("Failed to fetch offline songs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOfflineSongs();
  }, []);

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
          <div className="flex flex-col gap-y-2 w-full p-6">
            {offlineSongs.map((song) => (
              <SongItem
                key={song.id}
                data={song}
                onClick={(id) => {
                  /* Play local file logic */
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OfflinePage;
