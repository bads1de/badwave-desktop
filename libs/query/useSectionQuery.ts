import {
  keepPreviousData,
  onlineManager,
  useQuery,
} from "@tanstack/react-query";
import { CACHE_CONFIG } from "@/constants";
import { electronAPI, isNetworkError } from "@/libs/electron";

/**
 * getSectionData のセクション種別
 */
export type SectionDataType = "songs" | "spotlights" | "playlists";

export interface SectionQueryOptions<T> {
  queryKey: unknown[];
  /**
   * Web/Supabase 側の取得処理。
   * オフライン時は実行されず、スローした場合はネットワークエラー判定後に
   * offlineFallback を返す（それ以外のエラーはそのまま throw）。
   */
  webFn: () => Promise<T | null | undefined>;
  /** Electron 分岐（任意） */
  electron?: {
    /** getSectionData を使うセクション系キャッシュ */
    sectionKey?: string;
    sectionType?: SectionDataType;
    /** 任意のローカルDB取得。null/undefined なら Web 取得にフォールバック */
    getLocal?: () => Promise<T | null | undefined>;
  };
  initialData?: T;
  enabled?: boolean;
  /** ページ遷移時など古いデータを保持する */
  keepPreviousData?: boolean;
  /** Web オフライン時・ネットワークエラー時の戻り値（デフォルト undefined） */
  offlineFallback?: T;
  /** Electron の getSectionData が空だった場合の戻り値（セクション系フックで使用） */
  emptySectionFallback?: T;
  staleTime?: number;
  gcTime?: number;
  retry?: boolean | number;
  networkMode?: "online" | "always" | "offlineFirst";
}

/**
 * 「Electronキャッシュ → Supabase」の二又データ取得を1箇所に集約するクエリヘルパー。
 * hooks/data の各フックは、queryKey と webFn だけを渡す薄いラッパーになる。
 *
 * - Electron: ローカルキャッシュを優先（セクション用 / 任意取得 の2パターン）
 * - Web: オフライン時はフェッチをスキップし、ネットワークエラーは静かに扱う
 */
export function useSectionQuery<T>(options: SectionQueryOptions<T>) {
  const {
    queryKey,
    webFn,
    electron,
    initialData,
    enabled = true,
    keepPreviousData: useKeepPreviousData = false,
    offlineFallback,
    emptySectionFallback,
    staleTime = CACHE_CONFIG.staleTime,
    gcTime = CACHE_CONFIG.gcTime,
    retry = false,
    networkMode,
  } = options;

  const queryFn = async (): Promise<T | undefined> => {
    if (electron && electronAPI.isElectron()) {
      const { sectionKey, sectionType, getLocal } = electron;
      if (getLocal) {
        
        const local = await getLocal();

        if (local != null) return local;

        // ローカルに見つからない場合は Web 取得にフォールバック
      } else if (sectionKey) {
        const cached = await electronAPI.cache.getSectionData(
          sectionKey,
          sectionType ?? "songs",
        );

        if (cached != null) return cached as unknown as T;
        return emptySectionFallback ?? undefined;
      }
    }

    // Web オフライン時はフェッチをスキップ（キャッシュがあればそれを表示）
    if (!onlineManager.isOnline()) {
      return offlineFallback ?? undefined;
    }

    try {
      return (await webFn()) ?? undefined;
    } catch (error) {
      // ネットワークエラー・オフライン時はスローせずにフォールバック
      if (!onlineManager.isOnline() || isNetworkError(error)) {
        return offlineFallback ?? undefined;
      }
      throw error;
    }
  };

  const query = useQuery({
    queryKey,
    queryFn,
    enabled,
    staleTime,
    gcTime,
    retry,
    ...(useKeepPreviousData ? { placeholderData: keepPreviousData } : {}),
    ...(initialData !== undefined ? { initialData } : {}),
    ...(networkMode ? { networkMode } : {}),
  });

  const isPaused = query.fetchStatus === "paused";

  return { ...query, isPaused };
}