"use client";

import React, { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header/Header";
import { Button } from "@/components/ui/button";
import { Song } from "@/types";
import LocalFileTable, {
  ElectronApi,
  LocalFile,
} from "@/app/local/components/LocalFileTable";
import { mapFileToSong } from "@/libs/localFileMappers";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { AlertCircle, RefreshCw } from "lucide-react";
import usePlayer from "@/hooks/player/usePlayer";

declare global {
  interface Window {
    electron: ElectronApi;
  }
}

// 保存されたライブラリ情報の型
interface SavedLibraryInfo {
  exists: boolean;
  directoryPath?: string;
  fileCount?: number;
  lastScan?: string;
  directoryExists?: boolean;
  error?: string;
}

// スキャン情報の型
interface ScanInfo {
  newFiles: string[];
  modifiedFiles: string[];
  unchangedFiles: string[];
  deletedFiles: string[];
  isSameDirectory: boolean;
  isFullScan: boolean;
}

const LocalPage = () => {
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(
    null
  );
  const [mp3Files, setMp3Files] = useState<LocalFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedLibraryInfo, setSavedLibraryInfo] =
    useState<SavedLibraryInfo | null>(null);
  const [lastScanInfo, setLastScanInfo] = useState<ScanInfo | null>(null);

  // 統合プレイヤーシステムを使用
  const player = usePlayer();

  // アプリケーション起動時に保存されたライブラリ情報を取得
  useEffect(() => {
    const fetchSavedLibraryInfo = async () => {
      try {
        const result = await window.electron.ipc.invoke(
          "handle-get-saved-music-library"
        );

        if (result.error) {
          console.error("保存されたライブラリ情報の取得エラー:", result.error);
          return;
        }

        setSavedLibraryInfo(result);

        // 保存されたディレクトリが存在する場合は自動的に選択
        if (result.exists && result.directoryExists) {
          setSelectedDirectory(result.directoryPath);
        }
      } catch (err: any) {
        console.error(
          "保存されたライブラリ情報の取得中にエラーが発生しました:",
          err
        );
      }
    };

    fetchSavedLibraryInfo();
  }, []);

  // フォルダ選択ダイアログを表示
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

  // 強制的に完全スキャンを実行
  const handleForceFullScan = useCallback(async () => {
    if (!selectedDirectory) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setMp3Files([]);

    try {
      const result = await window.electron.ipc.invoke(
        "handle-scan-mp3-files",
        selectedDirectory,
        true // forceFullScan = true
      );

      if (result.error) {
        console.error("MP3スキャンエラー:", result.error);
        setError(`MP3スキャンエラー: ${result.error}`);
      } else {
        // スキャン情報を保存
        setLastScanInfo(result.scanInfo);
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
  }, [selectedDirectory]);

  // ディレクトリ選択時にMP3ファイルをスキャン（差分スキャン対応）
  useEffect(() => {
    const fetchMp3Files = async () => {
      if (!selectedDirectory) {
        return;
      }

      setIsLoading(true);
      setError(null);
      setMp3Files([]);

      try {
        // 差分スキャンを実行（forceFullScan = false）
        const result = await window.electron.ipc.invoke(
          "handle-scan-mp3-files",
          selectedDirectory,
          false // 差分スキャン
        );

        if (result.error) {
          console.error("MP3スキャンエラー:", result.error);
          setError(`MP3スキャンエラー: ${result.error}`);
        } else {
          // スキャン情報を保存
          setLastScanInfo(result.scanInfo);

          // スキャン結果をログ出力
          const { scanInfo } = result;
          console.log("スキャン結果:", {
            新規ファイル: scanInfo.newFiles.length,
            変更ファイル: scanInfo.modifiedFiles.length,
            変更なしファイル: scanInfo.unchangedFiles.length,
            削除ファイル: scanInfo.deletedFiles.length,
            同じディレクトリ: scanInfo.isSameDirectory,
            完全スキャン: scanInfo.isFullScan,
          });

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

  // MP3ファイルリストが更新されたらメタデータを取得（キャッシュ対応）
  useEffect(() => {
    const fetchAllMetadata = async () => {
      if (mp3Files.length === 0 || mp3Files.some((file) => !file.path)) {
        return;
      }

      setIsLoadingMetadata(true);

      // キャッシュからのロード数をカウント
      let cacheHitCount = 0;

      const filesWithMetadata = await Promise.all(
        mp3Files.map(async (file) => {
          if (!file.path) {
            return file;
          }

          try {
            const result = await window.electron.ipc.invoke(
              "handle-get-mp3-metadata",
              file.path
            );

            if (result.error) {
              return { ...file, error: result.error };
            }

            // キャッシュからのロードをカウント
            if (result.fromCache) {
              cacheHitCount++;
            }

            return { ...file, metadata: result.metadata };
          } catch (err: any) {
            return { ...file, error: err.message };
          }
        })
      );

      setMp3Files(filesWithMetadata);
      setIsLoadingMetadata(false);

      // キャッシュ利用状況をログ出力
      console.log(
        `メタデータ取得完了: ${cacheHitCount}/${mp3Files.length} ファイルがキャッシュから読み込まれました`
      );
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

  return (
    <div className="bg-[#0d0d0d] rounded-lg h-full w-full overflow-hidden overflow-y-auto pb-[80px] custom-scrollbar">
      <Header className="bg-gradient-to-b from-[#0d0d0d] via-[#0d0d0d] to-transparent">
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
        {/* 保存されたライブラリ情報 */}
        {savedLibraryInfo?.exists &&
          savedLibraryInfo.directoryExists &&
          !selectedDirectory && (
            <div className="bg-[#121212] border border-[#303030] rounded-md p-4 mb-4">
              <div className="text-purple-300 flex items-center gap-2 mb-2">
                <span className="text-purple-400">💾</span>
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
                  className="bg-purple-800 hover:bg-purple-700 text-white text-sm rounded-xl"
                >
                  このライブラリを読み込む
                </Button>
              </div>
            </div>
          )}

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
          <Button
            onClick={handleSelectDirectory}
            disabled={isLoading || isLoadingMetadata}
            className="bg-gradient-to-r from-purple-800 to-purple-600 hover:from-purple-700 hover:to-purple-500 text-white border-none shadow-md hover:shadow-lg transition-all duration-300 px-6 rounded-xl"
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

          {selectedDirectory && !isLoading && !isLoadingMetadata && (
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

        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-md p-4 mb-4 text-red-300">
            <p className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              {error}
            </p>
          </div>
        )}

        {(isLoading || isLoadingMetadata) && (
          <div className="bg-[#121212] border border-[#303030] rounded-md p-4 mb-4">
            <div className="text-purple-300 flex items-center gap-2">
              <span className="animate-pulse h-3 w-3 rounded-full bg-purple-500 inline-block"></span>
              ファイルをスキャン・メタデータ取得中...
            </div>
          </div>
        )}

        {/* スキャン結果の表示 */}
        {lastScanInfo &&
          !isLoading &&
          !isLoadingMetadata &&
          mp3Files.length > 0 && (
            <div className="bg-[#121212] border border-[#303030] rounded-md p-3 mb-4 text-sm">
              <div className="text-neutral-300 flex flex-wrap gap-x-4 gap-y-1">
                <span className="text-purple-400 font-semibold">
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
            <LocalFileTable mp3Files={mp3Files} onPlayFile={handlePlayFile} />
          </div>
        )}
      </div>

      {/* 統合プレイヤーシステムを使用するため、ここでのプレイヤー表示は不要 */}
    </div>
  );
};

export default LocalPage;
