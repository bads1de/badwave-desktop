'use client';

import React, { useEffect, useState } from 'react';
import { updater, isElectron } from '@/libs/electron-utils';
import { AlertCircle, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface UpdateProgressType {
  percent: number;
  bytesPerSecond: number;
  total: number;
  transferred: number;
}

/**
 * アップデート通知コンポーネント
 * Electronアプリケーションのアップデート状態を表示し、
 * ユーザーにアップデートの進行状況を通知します。
 */
const UpdateNotification: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<UpdateProgressType | null>(null);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Electronでない場合は何も表示しない
    if (!isElectron()) return;

    // アップデートが利用可能になったときのリスナーを登録
    const removeUpdateAvailableListener = updater.onUpdateAvailable(() => {
      setUpdateAvailable(true);
    });

    // ダウンロード進捗のリスナーを登録
    const removeDownloadProgressListener = updater.onDownloadProgress((progressObj) => {
      setDownloadProgress(progressObj);
    });

    // アップデートのダウンロードが完了したときのリスナーを登録
    const removeUpdateDownloadedListener = updater.onUpdateDownloaded((info) => {
      setUpdateDownloaded(true);
      setUpdateInfo(info);
    });

    // コンポーネントのクリーンアップ時にリスナーを解除
    return () => {
      removeUpdateAvailableListener();
      removeDownloadProgressListener();
      removeUpdateDownloadedListener();
    };
  }, []);

  // 手動でアップデートをチェック
  const handleCheckForUpdates = async () => {
    if (!isElectron()) return;

    setChecking(true);
    try {
      await updater.checkForUpdates();
      // 少し待ってからチェック中の状態を解除
      setTimeout(() => {
        setChecking(false);
      }, 3000);
    } catch (error) {
      console.error('アップデートチェック中にエラーが発生しました:', error);
      setChecking(false);
    }
  };

  // Electronでない場合は何も表示しない
  if (!isElectron()) {
    return null;
  }

  // アップデートがダウンロードされた場合
  if (updateDownloaded) {
    return (
      <Alert className="mb-4 bg-green-50 border-green-200">
        <AlertCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">アップデートの準備ができました</AlertTitle>
        <AlertDescription className="text-green-700">
          新しいバージョン {updateInfo?.releaseName || 'の更新'} がインストールされる準備ができました。
          アプリケーションを再起動して適用してください。
        </AlertDescription>
      </Alert>
    );
  }

  // アップデートのダウンロード中
  if (downloadProgress) {
    return (
      <Alert className="mb-4 bg-blue-50 border-blue-200">
        <Download className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">アップデートをダウンロード中</AlertTitle>
        <AlertDescription className="text-blue-700">
          <div className="mt-2">
            <Progress value={downloadProgress.percent} className="h-2" />
            <div className="text-xs mt-1 text-blue-600">
              {Math.round(downloadProgress.percent)}% 完了
              ({Math.round(downloadProgress.bytesPerSecond / 1024)} KB/s)
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // アップデートが利用可能
  if (updateAvailable) {
    return (
      <Alert className="mb-4 bg-amber-50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">新しいアップデートが利用可能です</AlertTitle>
        <AlertDescription className="text-amber-700">
          新しいバージョンのアプリケーションが利用可能です。
          自動的にダウンロードされます。
        </AlertDescription>
      </Alert>
    );
  }

  // 通常時（アップデートチェックボタンのみ表示）
  return (
    <div className="flex justify-end mb-4">
      <Button
        variant="outline"
        size="sm"
        onClick={handleCheckForUpdates}
        disabled={checking}
        className="text-xs"
      >
        {checking ? (
          <>
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            アップデートを確認中...
          </>
        ) : (
          <>
            <RefreshCw className="h-3 w-3 mr-1" />
            アップデートを確認
          </>
        )}
      </Button>
    </div>
  );
};

export default UpdateNotification;
