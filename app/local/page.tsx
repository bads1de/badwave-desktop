"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Header from "@/components/Header/Header";
import { Button } from "@/components/ui/button";
import LocalPlayerContent from "@/components/Player/LocalPlayerContent";
import { Song } from "@/types";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Play, Music, Clock, Disc, User } from "lucide-react";
import { formatTime } from "@/libs/helpers";

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

// ローカルファイルの型定義
interface LocalFile {
  path: string;
  metadata?: any;
  error?: string;
}

const LocalPage = () => {
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(
    null
  );
  const [mp3Files, setMp3Files] = useState<LocalFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPlayingFile, setCurrentPlayingFile] = useState<Song | null>(
    null
  ); // 再生中ファイルの状態

  // テーブルのカラム定義
  const columns = useMemo<ColumnDef<LocalFile>[]>(
    () => [
      {
        accessorKey: "title",
        header: () => (
          <div className="flex items-center gap-2">
            <Music className="h-4 w-4 text-purple-400" />
            <span>タイトル</span>
          </div>
        ),
        cell: ({ row }) => {
          const file = row.original;
          const title =
            file.metadata?.common?.title ||
            (file.path ? file.path.split(/[\\/]/).pop() : "読み込み中...");

          return (
            <div className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-[#202020] rounded-md flex items-center justify-center mr-2 group-hover:bg-purple-900/30 transition-colors duration-300">
                <Play className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-white truncate max-w-[300px] group-hover:text-purple-300 transition-colors duration-300">
                  {title}
                </span>
                {file.error && (
                  <span className="text-red-400 text-xs">メタデータエラー</span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "artist",
        header: () => (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-purple-400" />
            <span>アーティスト</span>
          </div>
        ),
        cell: ({ row }) => {
          const artist =
            row.original.metadata?.common?.artist || "不明なアーティスト";
          return (
            <div className="flex items-center">
              <span className="text-neutral-300 group-hover:text-white transition-colors duration-300">
                {artist}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "album",
        header: () => (
          <div className="flex items-center gap-2">
            <Disc className="h-4 w-4 text-purple-400" />
            <span>アルバム</span>
          </div>
        ),
        cell: ({ row }) => {
          const album =
            row.original.metadata?.common?.album || "不明なアルバム";
          return (
            <div className="flex items-center">
              <span className="text-neutral-300 group-hover:text-white transition-colors duration-300 truncate max-w-[200px]">
                {album}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "duration",
        header: () => (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-400" />
            <span>長さ</span>
          </div>
        ),
        cell: ({ row }) => {
          const duration = row.original.metadata?.format?.duration || 0;
          return (
            <div className="flex items-center">
              <span className="text-neutral-300 group-hover:text-white transition-colors duration-300 font-mono">
                {formatTime(duration)}
              </span>
            </div>
          );
        },
      },
      {
        id: "genre",
        accessorFn: (row) => row.metadata?.common?.genre?.[0] || "",
        header: () => (
          <div className="flex items-center gap-2">
            <span className="text-purple-400 text-xs">#</span>
            <span>ジャンル</span>
          </div>
        ),
        cell: ({ row }) => {
          const genre = row.original.metadata?.common?.genre?.[0] || "不明";
          return genre !== "不明" ? (
            <div className="flex items-center">
              <span className="px-2 py-1 rounded-full text-xs bg-purple-900/20 text-purple-300 border border-purple-800/30">
                {genre}
              </span>
            </div>
          ) : (
            <span className="text-neutral-500 text-xs">-</span>
          );
        },
      },
    ],
    []
  );

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

  const handlePlayFile = useCallback((file: LocalFile) => {
    if (file.path) {
      setCurrentPlayingFile(mapFileToSong(file));
    }
  }, []);

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
    <div className="bg-[#0d0d0d] rounded-lg h-full w-full overflow-hidden overflow-y-auto pb-[80px] custom-scrollbar">
      <Header className="bg-gradient-to-b from-[#0d0d0d] via-[#0d0d0d] to-transparent sticky top-0 z-10">
        <div className="mb-4">
          <h1 className="text-white text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-400">
            ローカルファイル
          </h1>
          <p className="text-neutral-400 text-sm mt-2">
            お気に入りの音楽をローカルから再生
          </p>
        </div>
      </Header>

      <div className="mt-4 mb-7 px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
          <Button
            onClick={handleSelectDirectory}
            disabled={isLoading || isLoadingMetadata}
            className="bg-gradient-to-r from-purple-800 to-purple-600 hover:from-purple-700 hover:to-purple-500 text-white border-none shadow-md hover:shadow-lg transition-all duration-300 px-6"
          >
            {isLoading || isLoadingMetadata ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>処理中...</span>
              </div>
            ) : (
              "フォルダを選択"
            )}
          </Button>

          {selectedDirectory && !isLoading && !isLoadingMetadata && !error && (
            <div className="bg-[#121212] px-4 py-2 rounded-md border border-[#303030] text-neutral-300 text-sm flex-1 md:max-w-md overflow-hidden">
              <span className="font-semibold text-purple-400">
                選択中のフォルダ:
              </span>{" "}
              <span className="truncate">{selectedDirectory}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-md p-4 mb-4 text-red-300">
            <p className="flex items-center gap-2">
              <span className="text-red-500">⚠</span> {error}
            </p>
          </div>
        )}

        {(isLoading || isLoadingMetadata) && (
          <div className="bg-[#121212] border border-[#303030] rounded-md p-4 mb-4">
            <p className="text-purple-300 flex items-center gap-2">
              <div className="animate-pulse h-3 w-3 rounded-full bg-purple-500"></div>
              ファイルをスキャン・メタデータ取得中...
            </p>
          </div>
        )}

        {!isLoading &&
          !isLoadingMetadata &&
          mp3Files.length === 0 &&
          selectedDirectory &&
          !error && (
            <div className="bg-[#121212] border border-[#303030] rounded-md p-6 mb-4 text-center">
              <p className="text-neutral-400 text-lg">
                選択されたフォルダにMP3ファイルが見つかりませんでした。
              </p>
              <p className="text-neutral-500 text-sm mt-2">
                別のフォルダを選択するか、MP3ファイルを追加してください。
              </p>
            </div>
          )}

        {/* テーブルコンポーネントを使用 */}
        {mp3Files.length > 0 && !isLoading && !isLoadingMetadata && (
          <div className="mt-6 mb-4">
            <DataTable
              columns={columns}
              data={mp3Files}
              searchKey="title"
              onRowClick={handlePlayFile}
            />
          </div>
        )}
      </div>

      {/* Playerを画面下部に固定表示 */}
      {currentPlayingFile && (
        <div className="fixed bottom-0 left-0 right-0 h-[80px] z-50 bg-[#121212] border-t border-[#303030] shadow-lg">
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
function mapFileToSong(file: LocalFile): Song {
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
