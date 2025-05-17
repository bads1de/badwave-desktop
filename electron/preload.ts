import { contextBridge, ipcRenderer } from 'electron';

// Electronの機能をウィンドウオブジェクトに安全に公開
contextBridge.exposeInMainWorld('electron', {
  // アプリケーション情報
  appInfo: {
    // アプリケーションのバージョンを取得
    getVersion: () => process.env.npm_package_version,
    // 実行環境がElectronかどうかを判定
    isElectron: true,
    // プラットフォーム情報
    platform: process.platform
  },

  // ウィンドウ操作
  window: {
    // ウィンドウを最小化
    minimize: () => ipcRenderer.invoke('window-minimize'),
    // ウィンドウを最大化/元のサイズに戻す
    maximize: () => ipcRenderer.invoke('window-maximize'),
    // ウィンドウを閉じる
    close: () => ipcRenderer.invoke('window-close')
  },

  // 設定ストア操作
  store: {
    // 設定値を取得
    get: (key: string) => ipcRenderer.invoke('get-store-value', key),
    // 設定値を保存
    set: (key: string, value: any) => ipcRenderer.invoke('set-store-value', key, value)
  },

  // メディア制御
  media: {
    // メディア制御イベントのリスナーを登録
    onMediaControl: (callback: (action: string) => void) => {
      const subscription = (_: any, action: string) => callback(action);
      ipcRenderer.on('media-control', subscription);
      
      // リスナーの登録解除関数を返す
      return () => {
        ipcRenderer.removeListener('media-control', subscription);
      };
    }
  },

  // IPC通信
  ipc: {
    // メインプロセスにメッセージを送信し、応答を待つ
    invoke: (channel: string, ...args: any[]) => {
      // 許可されたチャンネルのみ通信可能
      const validChannels = [
        'get-store-value',
        'set-store-value',
        'window-minimize',
        'window-maximize',
        'window-close',
        'api-request'
      ];
      
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args);
      }
      
      throw new Error(`Channel "${channel}" is not allowed for security reasons.`);
    },
    
    // メインプロセスからのメッセージを受信
    on: (channel: string, callback: (...args: any[]) => void) => {
      // 許可されたチャンネルのみ通信可能
      const validChannels = [
        'media-control',
        'update-available',
        'download-progress',
        'update-downloaded'
      ];
      
      if (validChannels.includes(channel)) {
        const subscription = (_: any, ...args: any[]) => callback(...args);
        ipcRenderer.on(channel, subscription);
        
        // リスナーの登録解除関数を返す
        return () => {
          ipcRenderer.removeListener(channel, subscription);
        };
      }
      
      throw new Error(`Channel "${channel}" is not allowed for security reasons.`);
    },
    
    // メインプロセスにメッセージを送信（応答を待たない）
    send: (channel: string, ...args: any[]) => {
      // 許可されたチャンネルのみ通信可能
      const validChannels = [
        'log',
        'player-state-change'
      ];
      
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, ...args);
      } else {
        throw new Error(`Channel "${channel}" is not allowed for security reasons.`);
      }
    }
  }
});

// コンソールにプリロードスクリプトが実行されたことを表示
console.log('Preload script has been loaded');
