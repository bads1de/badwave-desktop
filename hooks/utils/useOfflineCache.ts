"use client";

import { useCallback } from "react";

import { electronAPI } from "@/libs/electron-utils";

/** キャッシュのプレフィックス */
const OFFLINE_CACHE_PREFIX = "@offline-cache";

/** デフォルトのキャッシュ有効期限（24時間） */
const DEFAULT_MAX_AGE = 1000 * 60 * 60 * 24;

/** キャッシュエントリの構造 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/** loadFromCache のオプション */
interface LoadFromCacheOptions {
  /** キャッシュの有効期限（ミリ秒） */
  maxAge?: number;
}

/** useOfflineCache の戻り値の型 */
export interface OfflineCacheAPI {
  /** データをキャッシュに保存 */
  saveToCache: <T>(key: string, data: T) => Promise<void>;
  /** キャッシュからデータを読み込み */
  loadFromCache: <T>(
    key: string,
    options?: LoadFromCacheOptions
  ) => Promise<T | null>;
  /** キャッシュを削除 */
  clearCache: (key: string) => Promise<void>;
  /** キャッシュが有効かどうかを確認 */
  isCacheValid: (key: string, maxAge?: number) => Promise<boolean>;
}

/**
 * Electron Store を使ったオフラインキャッシュを管理するフック
 *
 * @returns {OfflineCacheAPI} キャッシュ操作のAPIオブジェクト
 *
 * @example
 * ```tsx
 * const { saveToCache, loadFromCache } = useOfflineCache();
 *
 * // データを保存
 * await saveToCache('songs', songsData);
 *
 * // データを読み込み
 * const cachedSongs = await loadFromCache('songs');
 * ```
 */
export function useOfflineCache(): OfflineCacheAPI {
  /**
   * キャッシュキーを生成
   */
  const getCacheKey = useCallback((key: string): string => {
    return `${OFFLINE_CACHE_PREFIX}:${key}`;
  }, []);

  // Removed getStore as we use electronAPI.store directly

  /**
   * データをキャッシュに保存
   */
  const saveToCache = useCallback(
    async <T>(key: string, data: T): Promise<void> => {
      const cacheKey = getCacheKey(key);
      const cacheEntry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
      };

      await electronAPI.store.set(cacheKey, cacheEntry);
    },
    [getCacheKey]
  );

  /**
   * キャッシュからデータを読み込み
   */
  const loadFromCache = useCallback(
    async <T>(
      key: string,
      options?: LoadFromCacheOptions
    ): Promise<T | null> => {
      const cacheKey = getCacheKey(key);
      try {
        const cached = await electronAPI.store.get(cacheKey);

        if (!cached) return null;

        const cacheEntry = cached as CacheEntry<T>;
        const maxAge = options?.maxAge ?? DEFAULT_MAX_AGE;
        const now = Date.now();

        // 有効期限をチェック
        if (now - cacheEntry.timestamp > maxAge) {
          return null;
        }

        return cacheEntry.data;
      } catch (e) {
        console.error("Failed to load from cache:", e);
        return null;
      }
    },
    [getCacheKey]
  );

  /**
   * キャッシュを削除
   */
  const clearCache = useCallback(
    async (key: string): Promise<void> => {
      const cacheKey = getCacheKey(key);
      await electronAPI.store.set(cacheKey, null);
    },
    [getCacheKey]
  );

  /**
   * キャッシュが有効かどうかを確認
   */
  const isCacheValid = useCallback(
    async (key: string, maxAge: number = DEFAULT_MAX_AGE): Promise<boolean> => {
      const cacheKey = getCacheKey(key);
      try {
        const cached = await electronAPI.store.get(cacheKey);

        if (!cached) return false;

        const cacheEntry = cached as CacheEntry<unknown>;
        const now = Date.now();

        return now - cacheEntry.timestamp <= maxAge;
      } catch {
        return false;
      }
    },
    [getCacheKey]
  );

  return {
    saveToCache,
    loadFromCache,
    clearCache,
    isCacheValid,
  };
}
