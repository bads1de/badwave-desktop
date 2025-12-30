"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import Header from "@/components/Header/Header";
import { Button } from "@/components/ui/button";
import { mapFileToSong } from "@/libs/localFileMappers";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import {
  AlertCircle,
  RefreshCw,
  Music,
  Clock,
  Disc,
  User,
  Play,
} from "lucide-react";
import usePlayer from "@/hooks/player/usePlayer";
import useGetLocalFiles from "@/hooks/data/useGetLocalFiles";
import useGetSavedLibraryInfo from "@/hooks/data/useGetSavedLibraryInfo";

import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { formatTime } from "@/libs/utils";

// --- Types ---

export interface ElectronApi {
  ipc: {
    invoke: (channel: string, ...args: any[]) => Promise<any>;
  };
}

export interface LocalFile {
  path: string;
  metadata?: any;
  error?: string;
}

declare global {
  interface Window {
    electron: ElectronApi;
  }
}

// --- Sub-components ---

interface LocalFileTableProps {
  mp3Files: LocalFile[];
  onPlayFile: (file: LocalFile) => void;
}

const LocalFileTable: React.FC<LocalFileTableProps> = ({
  mp3Files,
  onPlayFile,
}) => {
  const columns = useMemo<ColumnDef<LocalFile>[]>(
    () => [
      {
        id: "title",
        accessorFn: (row) => {
          return (
            row.metadata?.common?.title ||
            (row.path ? row.path.split(/[\\/]/).pop() : "")
          );
        },
        header: () => (
          <div className="flex items-center gap-2">
            <Music className="h-4 w-4 text-theme-400" />
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
              <div className="w-8 h-8 bg-[#202020] rounded-lg flex items-center justify-center mr-2 group-hover:bg-theme-900/30 transition-all duration-300">
                <Play className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-white truncate max-w-[300px] group-hover:text-theme-300 transition-colors duration-300">
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
        id: "artist",
        accessorFn: (row) => {
          return row.metadata?.common?.artist || "不明なアーティスト";
        },
        header: () => (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-theme-400" />
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
        id: "album",
        accessorFn: (row) => {
          return row.metadata?.common?.album || "不明なアルバム";
        },
        header: () => (
          <div className="flex items-center gap-2">
            <Disc className="h-4 w-4 text-theme-400" />
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
        id: "duration",
        accessorFn: (row) => {
          return row.metadata?.format?.duration || 0;
        },
        header: () => (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-theme-400" />
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
            <span className="text-theme-400 text-xs">#</span>
            <span>ジャンル</span>
          </div>
        ),
        cell: ({ row }) => {
          const genre = row.original.metadata?.common?.genre?.[0] || "不明";
          return genre !== "不明" ? (
            <div className="flex items-center">
              <span className="px-3 py-1 rounded-full text-xs bg-theme-900/20 text-theme-300 border border-theme-800/30 hover:bg-theme-800/30 transition-colors duration-300">
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

  return (
    <DataTable
      columns={columns}
      data={mp3Files}
      searchKey="title"
      onRowClick={onPlayFile}
    />
  );
};

// --- Main Page Component ---

const LocalPage = () => {
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(
    null
  );
  const [isSelectingDirectory, setIsSelectingDirectory] = useState(false);
  const [selectError, setSelectError] = useState<string | null>(null);
  const [forceFullScan, setForceFullScan] = useState(false);

  // 統合プレイヤーシステムを使用
  const player = usePlayer();

  // TanStack Query を使用してキャッシュ戦略を適用
  const { libraryInfo: savedLibraryInfo, isLoading: isLoadingLibraryInfo } =
    useGetSavedLibraryInfo();

  // 保存されたディレクトリを自動選択
  useEffect(() => {
    if (
      savedLibraryInfo?.exists &&
      savedLibraryInfo?.directoryExists &&
      !selectedDirectory
    ) {
      setSelectedDirectory(savedLibraryInfo.directoryPath || null);
    }
  }, [savedLibraryInfo, selectedDirectory]);

  // ローカルファイルを取得（キャッシュ対応）
  const {
    files: mp3Files,
    isLoading,
    error,
    scanInfo: lastScanInfo,
    forceRescan,
  } = useGetLocalFiles(selectedDirectory, forceFullScan);

  // フォルダ選択ダイアログを表示
  const handleSelectDirectory = async () => {
    setIsSelectingDirectory(true);
    setSelectError(null);

    try {
      const result = await window.electron.ipc.invoke(
        "handle-select-directory"
      );

      if (result.canceled) {
        console.log("フォルダ選択がキャンセルされました。");
        setIsSelectingDirectory(false);
        return;
      }

      if (result.error) {
        console.error("フォルダ選択エラー:", result.error);
        setSelectError(`フォルダ選択エラー: ${result.error}`);
        setIsSelectingDirectory(false);
        return;
      }

      setSelectedDirectory(result.filePath);
      // 新しいディレクトリが選択された場合、forceFullScan をリセット
      setForceFullScan(false);
    } catch (err: any) {
      console.error("フォルダ選択中にエラーが発生しました:", err);
      setSelectError(`フォルダ選択中にエラーが発生しました: ${err.message}`);
    } finally {
      setIsSelectingDirectory(false);
    }
  };

  // 強制的に完全スキャンを実行
  const handleForceFullScan = useCallback(async () => {
    setForceFullScan(true);
    // キャッシュを無効化して再取得
    await forceRescan();
    // スキャン完了後に forceFullScan をリセット
    setForceFullScan(false);
  }, [forceRescan]);

  /**
   * ファイルを再生する（統合プレイヤーシステムを使用）
   * @param {LocalFile} file - 再生するファイル
   */
  const handlePlayFile = useCallback(
    (file: LocalFile) => {
      if (file.path) {
        const song = mapFileToSong(file);
        // ローカル曲をプレイヤーストアに保存
        player.setLocalSong(song);

        // 全てのローカル曲をプレイヤーストアに保存し、IDリストを作成
        const songIds: string[] = [];
        mp3Files.forEach((f) => {
          if (f.path) {
            const localSong = mapFileToSong(f);
            player.setLocalSong(localSong);
            songIds.push(localSong.id);
          }
        });

        // プレイリストを設定
        player.setIds(songIds);
        // 現在の曲を設定
        player.setId(song.id);
      }
    },
    [player, mp3Files]
  );

  // エラーメッセージ（選択エラーまたはスキャンエラー）
  const errorMessage =
    selectError ||
    (error instanceof Error ? error.message : error ? String(error) : null);

  return (
    <div className="bg-[#0d0d0d] rounded-lg h-full w-full overflow-hidden overflow-y-auto pb-[80px] custom-scrollbar">
      <Header className="bg-gradient-to-b from-[#0d0d0d] via-[#0d0d0d] to-transparent">
        <div className="mb-4">
          <h1 className="text-white text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-theme-400">
            ローカルファイル
          </h1>
          <p className="text-neutral-400 text-sm mt-2">
            お気に入りの音楽をローカルから再生
          </p>
        </div>
      </Header>

      <div className="mt-4 mb-7 px-6">
        {/* 保存されたライブラリ情報 */}
        {savedLibraryInfo?.exists &&
          savedLibraryInfo.directoryExists &&
          !selectedDirectory && (
            <div className="bg-[#121212] border border-[#303030] rounded-md p-4 mb-4">
              <div className="text-theme-300 flex items-center gap-2 mb-2">
                <span className="text-theme-400">💾</span>
                <span className="font-semibold">保存されたライブラリ</span>
              </div>
              <div className="text-neutral-300 text-sm">
                <p>
                  <span className="text-neutral-400">フォルダ:</span>{" "}
                  <span className="text-white">
                    {savedLibraryInfo.directoryPath}
                  </span>
                </p>
                <p>
                  <span className="text-neutral-400">ファイル数:</span>{" "}
                  <span className="text-white">
                    {savedLibraryInfo.fileCount}曲
                  </span>
                </p>
                <p>
                  <span className="text-neutral-400">最終スキャン:</span>{" "}
                  <span className="text-white">
                    {savedLibraryInfo.lastScan
                      ? formatDistanceToNow(
                          new Date(savedLibraryInfo.lastScan),
                          {
                            addSuffix: true,
                            locale: ja,
                          }
                        )
                      : "不明"}
                  </span>
                </p>
              </div>
              <div className="mt-3">
                <Button
                  onClick={() =>
                    setSelectedDirectory(savedLibraryInfo.directoryPath || null)
                  }
                  className="bg-theme-800 hover:bg-theme-700 text-white text-sm rounded-xl"
                >
                  このライブラリを読み込む
                </Button>
              </div>
            </div>
          )}

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
          <Button
            onClick={handleSelectDirectory}
            disabled={isLoading || isSelectingDirectory}
            className="bg-gradient-to-r from-theme-800 to-theme-600 hover:from-theme-700 hover:to-theme-500 text-white border-none shadow-md hover:shadow-lg transition-all duration-300 px-6 rounded-xl"
          >
            {isLoading || isSelectingDirectory ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>処理中...</span>
              </div>
            ) : (
              "フォルダを選択"
            )}
          </Button>

          {selectedDirectory && !isLoading && !errorMessage && (
            <div className="bg-[#121212] px-4 py-2 rounded-md border border-[#303030] text-neutral-300 text-sm flex-1 md:max-w-md overflow-hidden">
              <span className="font-semibold text-purple-400">
                選択中のフォルダ:
              </span>{" "}
              <span className="truncate">{selectedDirectory}</span>
            </div>
          )}

          {selectedDirectory && !isLoading && (
            <Button
              onClick={handleForceFullScan}
              className="bg-[#303030] hover:bg-[#404040] text-white text-sm flex items-center gap-1 rounded-xl"
              title="すべてのファイルを再スキャンします"
            >
              <RefreshCw className="h-4 w-4" />
              <span>再スキャン</span>
            </Button>
          )}
        </div>

        {errorMessage && (
          <div className="bg-red-900/20 border border-red-800 rounded-md p-4 mb-4 text-red-300">
            <p className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              {errorMessage}
            </p>
          </div>
        )}

        {isLoading && (
          <div className="bg-[#121212] border border-[#303030] rounded-md p-4 mb-4">
            <div className="text-theme-300 flex items-center gap-2">
              <span className="animate-pulse h-3 w-3 rounded-full bg-theme-500 inline-block"></span>
              ファイルをスキャン・メタデータ取得中...
            </div>
          </div>
        )}

        {/* スキャン結果の表示 */}
        {lastScanInfo && !isLoading && mp3Files.length > 0 && (
          <div className="bg-[#121212] border border-[#303030] rounded-md p-3 mb-4 text-sm">
            <div className="text-neutral-300 flex flex-wrap gap-x-4 gap-y-1">
              <span className="text-theme-400 font-semibold">
                スキャン結果:
              </span>
              {lastScanInfo.isFullScan ? (
                <span className="text-green-400">完全スキャン</span>
              ) : (
                <span className="text-blue-400">差分スキャン</span>
              )}
              {lastScanInfo.newFiles.length > 0 && (
                <span>
                  新規:{" "}
                  <span className="text-green-400">
                    {lastScanInfo.newFiles.length}ファイル
                  </span>
                </span>
              )}
              {lastScanInfo.modifiedFiles.length > 0 && (
                <span>
                  変更:{" "}
                  <span className="text-yellow-400">
                    {lastScanInfo.modifiedFiles.length}ファイル
                  </span>
                </span>
              )}
              {lastScanInfo.unchangedFiles.length > 0 && (
                <span>
                  変更なし:{" "}
                  <span className="text-neutral-400">
                    {lastScanInfo.unchangedFiles.length}ファイル
                  </span>
                </span>
              )}
              {lastScanInfo.deletedFiles.length > 0 && (
                <span>
                  削除:{" "}
                  <span className="text-red-400">
                    {lastScanInfo.deletedFiles.length}ファイル
                  </span>
                </span>
              )}
            </div>
          </div>
        )}

        {!isLoading &&
          mp3Files.length === 0 &&
          selectedDirectory &&
          !errorMessage && (
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
        {mp3Files.length > 0 && !isLoading && (
          <div className="mt-6 mb-4">
            <LocalFileTable mp3Files={mp3Files} onPlayFile={handlePlayFile} />
          </div>
        )}
      </div>
    </div>
  );
};

export default LocalPage;
