"use client";

import React, { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header/Header";
import { Button } from "@/components/ui/button";
import LocalPlayerContent from "@/components/Player/LocalPlayerContent"; // LocalPlayerContentをインポート
import { Song } from "@/types"; // Song型をインポート

// Electron APIの型定義 (必要に応じて拡張)
interface ElectronApi {
  ipc: {
    invoke: (channel: string, ...args: any[]) => Promise<any>;
  };
}

declare global {
  interface Window {
    electron: ElectronApi;
  }
}

const LocalPage = () => {
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(
    null
  );
  const [mp3Files, setMp3Files] = useState<
    { path: string; metadata?: any; error?: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPlayingFile, setCurrentPlayingFile] = useState<Song | null>(
    null
  ); // 再生中ファイルの状態

  const handleSelectDirectory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await window.electron.ipc.invoke(
        "handle-select-directory"
      );
      if (result.canceled) {
        console.log("フォルダ選択がキャンセルされました。");
        setIsLoading(false);
        return;
      }
      if (result.error) {
        console.error("フォルダ選択エラー:", result.error);
        setError(`フォルダ選択エラー: ${result.error}`);
        setIsLoading(false);
        return;
      }
      setSelectedDirectory(result.filePath);
    } catch (err: any) {
      console.error("フォルダ選択中にエラーが発生しました:", err);
      setError(`フォルダ選択中にエラーが発生しました: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchMp3Files = async () => {
      if (!selectedDirectory) return;
      setIsLoading(true);
      setError(null);
      setMp3Files([]); // ディレクトリ変更時にリストをクリア
      try {
        const result = await window.electron.ipc.invoke(
          "handle-scan-mp3-files",
          selectedDirectory
        );
        if (result.error) {
          console.error("MP3スキャンエラー:", result.error);
          setError(`MP3スキャンエラー: ${result.error}`);
        } else {
          // パスのみのオブジェクトとして初期化
          setMp3Files((result.files || []).map((path: string) => ({ path })));
        }
      } catch (err: any) {
        console.error("MP3スキャン中にエラーが発生しました:", err);
        setError(`MP3スキャン中にエラーが発生しました: ${err.message}`);
        setMp3Files([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMp3Files();
  }, [selectedDirectory]);

  useEffect(() => {
    const fetchAllMetadata = async () => {
      if (mp3Files.length === 0 || mp3Files.some((file) => !file.path)) return;

      setIsLoadingMetadata(true);
      const filesWithMetadata = await Promise.all(
        mp3Files.map(async (file) => {
          if (!file.path) return file; // pathがない場合はそのまま返す
          try {
            const result = await window.electron.ipc.invoke(
              "handle-get-mp3-metadata",
              file.path
            );
            if (result.error) {
              return { ...file, error: result.error };
            }
            return { ...file, metadata: result.metadata };
          } catch (err: any) {
            return { ...file, error: err.message };
          }
        })
      );
      setMp3Files(filesWithMetadata);
      setIsLoadingMetadata(false);
    };

    // selectedDirectoryが変更された後、またはmp3Filesが初期化された後にメタデータを取得
    if (
      selectedDirectory &&
      mp3Files.length > 0 &&
      mp3Files.every((file) => file.path && !file.metadata && !file.error)
    ) {
      fetchAllMetadata();
    }
  }, [mp3Files, selectedDirectory]);

  const handlePlayFile = useCallback(
    (file: { path: string; metadata?: any }) => {
      if (file.path) {
        setCurrentPlayingFile(mapFileToSong(file));
      }
    },
    []
  );

  const handlePlayNext = useCallback(() => {
    if (!currentPlayingFile) return;
    const currentIndex = mp3Files.findIndex(
      (f) => f.path === currentPlayingFile.song_path
    );
    if (currentIndex !== -1 && currentIndex < mp3Files.length - 1) {
      setCurrentPlayingFile(mapFileToSong(mp3Files[currentIndex + 1]));
    } else if (currentIndex === mp3Files.length - 1) {
      // リストの最後の場合は最初の曲へ（ループ再生的な挙動）
      if (mp3Files.length > 0) {
        setCurrentPlayingFile(mapFileToSong(mp3Files[0]));
      }
    }
  }, [currentPlayingFile, mp3Files]);

  const handlePlayPrevious = useCallback(() => {
    if (!currentPlayingFile) return;
    const currentIndex = mp3Files.findIndex(
      (f) => f.path === currentPlayingFile.song_path
    );
    if (currentIndex > 0) {
      setCurrentPlayingFile(mapFileToSong(mp3Files[currentIndex - 1]));
    } else if (currentIndex === 0 && mp3Files.length > 0) {
      // リストの最初の場合は最後の曲へ
      setCurrentPlayingFile(mapFileToSong(mp3Files[mp3Files.length - 1]));
    }
  }, [currentPlayingFile, mp3Files]);

  return (
    <div className="bg-neutral-900 rounded-lg h-full w-full overflow-hidden overflow-y-auto pb-[80px]">
      {" "}
      {/* Playerの高さ分padding-bottomを追加 */}
      <Header className="from-neutral-900">
        <div className="mb-2">
          <h1 className="text-white text-3xl font-semibold">
            ローカルファイル
          </h1>
        </div>
      </Header>
      <div className="mt-2 mb-7 px-6">
        <Button
          onClick={handleSelectDirectory}
          disabled={isLoading || isLoadingMetadata}
          className="mb-4"
        >
          {isLoading || isLoadingMetadata ? "処理中..." : "フォルダを選択"}
        </Button>
        {error && <p className="text-red-500">{error}</p>}
        {selectedDirectory && !isLoading && !isLoadingMetadata && !error && (
          <p className="text-neutral-400 text-sm mb-2">
            選択中のフォルダ: {selectedDirectory}
          </p>
        )}
        {(isLoading || isLoadingMetadata) && (
          <p className="text-neutral-400">
            ファイルをスキャン・メタデータ取得中...
          </p>
        )}
        {!isLoading &&
          !isLoadingMetadata &&
          mp3Files.length === 0 &&
          selectedDirectory &&
          !error && (
            <p className="text-neutral-400">
              選択されたフォルダにMP3ファイルが見つかりませんでした。
            </p>
          )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-8 gap-4 mt-4">
          {mp3Files.map((file, index) => (
            <div
              key={index}
              className="bg-neutral-800 p-3 rounded flex flex-col justify-between cursor-pointer hover:bg-neutral-700 transition"
              onClick={() => handlePlayFile(file)}
            >
              <div>
                <p className="text-white truncate font-semibold">
                  {file.metadata?.common?.title ||
                    (file.path
                      ? file.path.split(/[\\/]/).pop()
                      : "読み込み中...")}
                </p>
                <p className="text-neutral-400 text-sm truncate">
                  {file.metadata?.common?.artist || "不明なアーティスト"}
                </p>
                <p className="text-neutral-400 text-sm truncate">
                  {file.metadata?.common?.album || "不明なアルバム"}
                </p>
                {file.error && (
                  <p className="text-red-400 text-xs">
                    メタデータエラー: {file.error}
                  </p>
                )}
              </div>
              {/* 再生ボタンはカード全体をクリック可能にしたため削除 */}
            </div>
          ))}
        </div>
      </div>
      {/* Playerを画面下部に固定表示 */}
      {currentPlayingFile && (
        <div className="fixed bottom-0 left-0 right-0 h-[80px] z-50 bg-[#121212]">
          <LocalPlayerContent
            song={currentPlayingFile}
            onPlayNext={handlePlayNext}
            onPlayPrevious={handlePlayPrevious}
          />
        </div>
      )}
    </div>
  );
};

export default LocalPage;

// Helper function to map file data to Song type
function mapFileToSong(file: { path: string; metadata?: any }): Song {
  // Ensure file.path exists before trying to split it
  const titleFromFile = file.path
    ? file.path.split(/[\\/]/).pop() || "不明なタイトル"
    : "不明なタイトル";

  return {
    id: file.path, // Use path as ID (unique)
    user_id: "", // Empty for local files
    author: file.metadata?.common?.artist || "不明なアーティスト",
    title: file.metadata?.common?.title || titleFromFile,
    song_path: file.path,
    image_path: "", // Image path needs separate handling for local files, empty for now
    video_path: "",
    genre: file.metadata?.common?.genre?.[0] || "",
    duration: file.metadata?.format?.duration || 0,
    created_at: new Date().toISOString(), // Or use file system's creation/modification time if available
    public: false, // Local files are not public
  };
}
