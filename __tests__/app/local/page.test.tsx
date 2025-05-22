import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import LocalPage from '@/app/local/page';

// モックの設定
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Electronのモック
const mockInvoke = jest.fn();
const mockElectron = {
  ipc: {
    invoke: mockInvoke,
  },
};

// グローバルオブジェクトにElectronを追加
Object.defineProperty(window, 'electron', {
  value: mockElectron,
  writable: true,
});

describe('LocalPage', () => {
  beforeEach(() => {
    // モックをリセット
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('保存されたライブラリ情報を取得する', async () => {
    // 保存されたライブラリ情報のモック
    mockInvoke.mockImplementation((channel, ...args) => {
      if (channel === 'handle-get-saved-music-library') {
        return Promise.resolve({
          exists: true,
          directoryPath: 'test-dir',
          fileCount: 10,
          lastScan: new Date().toISOString(),
          directoryExists: true,
        });
      }
      return Promise.resolve({});
    });

    // コンポーネントをレンダリング
    await act(async () => {
      render(<LocalPage />);
    });

    // 保存されたライブラリ情報が表示されることを確認
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('handle-get-saved-music-library');
    });
  });

  it('ディレクトリ選択時にMP3ファイルをスキャンする', async () => {
    // モックの設定
    mockInvoke.mockImplementation((channel, ...args) => {
      if (channel === 'handle-get-saved-music-library') {
        return Promise.resolve({ exists: false });
      } else if (channel === 'handle-select-directory') {
        return Promise.resolve({ filePath: 'test-dir' });
      } else if (channel === 'handle-scan-mp3-files') {
        return Promise.resolve({
          files: ['test-dir/song1.mp3', 'test-dir/song2.mp3'],
          scanInfo: {
            newFiles: ['test-dir/song1.mp3', 'test-dir/song2.mp3'],
            modifiedFiles: [],
            unchangedFiles: [],
            deletedFiles: [],
            isSameDirectory: false,
            isFullScan: true,
          },
        });
      } else if (channel === 'handle-get-mp3-metadata') {
        return Promise.resolve({
          metadata: {
            common: {
              title: 'Test Song',
              artist: 'Test Artist',
              album: 'Test Album',
              genre: ['Test Genre'],
            },
            format: {
              duration: 180,
            },
          },
          fromCache: false,
        });
      }
      return Promise.resolve({});
    });

    // コンポーネントをレンダリング
    await act(async () => {
      render(<LocalPage />);
    });

    // フォルダ選択ボタンが表示されることを確認
    expect(screen.getByText('フォルダを選択')).toBeInTheDocument();
  });
});
