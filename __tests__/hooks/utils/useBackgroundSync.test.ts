import { renderHook, waitFor } from "@testing-library/react";
import { useBackgroundSync } from "@/hooks/utils/useBackgroundSync";

// モジュール自体の型を取得するためにインポート
import { useUser } from "@/hooks/auth/useUser";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { createClient } from "@/libs/supabase/client";
import { electronAPI } from "@/libs/electron-utils";
import { useQueryClient } from "@tanstack/react-query";

// モックのセットアップ
const mockSupabaseFrom = jest.fn();
const mockSupabase = {
  from: mockSupabaseFrom,
};

// モジュールモック
jest.mock("@/hooks/auth/useUser", () => ({
  useUser: jest.fn(),
}));
jest.mock("@/hooks/utils/useNetworkStatus", () => ({
  useNetworkStatus: jest.fn(),
}));
jest.mock("@/libs/supabase/client", () => ({
  createClient: () => mockSupabase,
}));
jest.mock("@/libs/electron-utils", () => ({
  electronAPI: {
    isElectron: jest.fn(),
    cache: {
      syncPlaylists: jest.fn(),
      syncPlaylistSongs: jest.fn(),
      syncLikedSongs: jest.fn(),
    },
  },
}));
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: jest.fn(),
}));

describe("useBackgroundSync", () => {
  // Supabase チェーンのモックヘルパー
  const createQueryBuilder = (mockData: any, mockError: any = null) => {
    const builder: any = {};
    builder.select = jest.fn().mockReturnValue(builder);
    builder.eq = jest.fn().mockReturnValue(builder);
    builder.order = jest.fn().mockReturnValue(builder);
    builder.single = jest.fn().mockReturnValue(builder);
    // await可能にするためのthenメソッド
    builder.then = (resolve: any) =>
      Promise.resolve({ data: mockData, error: mockError }).then(resolve);
    return builder;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // デバッグのため一時的にログを表示させる
    jest
      .spyOn(console, "log")
      .mockImplementation((...args) =>
        process.stdout.write(JSON.stringify(args) + "\n")
      );
    jest
      .spyOn(console, "error")
      .mockImplementation((...args) =>
        process.stdout.write("ERROR: " + JSON.stringify(args) + "\n")
      );

    // デフォルトのモック戻り値
    (useUser as jest.Mock).mockReturnValue({ user: { id: "test-user" } });
    (useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: true });
    (electronAPI.isElectron as jest.Mock).mockReturnValue(true);
    (useQueryClient as jest.Mock).mockReturnValue({
      invalidateQueries: jest.fn(),
    });

    // Supabase チェーンのモック
    mockSupabaseFrom.mockImplementation((table) => {
      if (table === "playlists") {
        return createQueryBuilder([{ id: "p1", title: "Playlist 1" }]);
      } else if (table === "playlist_songs") {
        return createQueryBuilder([
          { id: "ps1", songs: { id: "s1", title: "Song 1" } },
        ]);
      } else if (table === "liked_songs_regular") {
        return createQueryBuilder([
          { id: "ls1", songs: { id: "s2", title: "Song 2" } },
        ]);
      }
      return createQueryBuilder([]);
    });
  });

  it("should sync library when online and user is logged in", async () => {
    renderHook(() => useBackgroundSync());

    // まずSupabase呼び出しが始まったか確認
    await waitFor(
      () => {
        expect(mockSupabase.from).toHaveBeenCalled();
      },
      { timeout: 1000 }
    );

    await waitFor(
      () => {
        expect(mockSupabase.from).toHaveBeenCalledWith("playlists");
      },
      { timeout: 1000 }
    );

    await waitFor(
      () => {
        if (
          (electronAPI.cache.syncPlaylists as jest.Mock).mock.calls.length === 0
        ) {
          throw new Error("syncPlaylists not called yet");
        }
        expect(electronAPI.cache.syncPlaylists).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 }
    );

    await waitFor(
      () => {
        expect(electronAPI.cache.syncPlaylistSongs).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 }
    );

    await waitFor(
      () => {
        expect(electronAPI.cache.syncLikedSongs).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 }
    );
  });

  it("should skip sync when offline", async () => {
    (useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: false });

    renderHook(() => useBackgroundSync());

    // 少し待機しても同期関数が呼ばれていないことを確認
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockSupabase.from).not.toHaveBeenCalled();
    expect(electronAPI.cache.syncPlaylists).not.toHaveBeenCalled();
  });

  it("should handle error gracefully when offline detected during sync", async () => {
    // プレイリスト取得後の曲取得でエラー（オフライン想定）を発生させる
    mockSupabase.from.mockImplementation((table) => {
      if (table === "playlists") {
        return createQueryBuilder([{ id: "p1", title: "Playlist 1" }]);
      }
      if (table === "playlist_songs") {
        // ここでエラーを返すようにする
        return createQueryBuilder(null, new Error("Network Error"));
      }
      return createQueryBuilder([]);
    });

    // テスト中に isOnline の ref 値を変更するのは難しいため、
    // ここではエラーが発生しても console.error が抑制される（または適切に処理される）ことを
    // ロジックの通り確認したいが、ref の更新は useEffect 依存なので
    // renderHook の rerender でシミュレートする

    const { rerender } = renderHook(() => useBackgroundSync());

    // 同期開始を待つ
    await waitFor(() =>
      expect(mockSupabase.from).toHaveBeenCalledWith("playlists")
    );

    // ここでオフラインにする
    (useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: false });
    rerender();

    // エラー終了せずに完了しているか（例外がthrowされていないか）を確認
    await waitFor(() => {
      // 少なくとも1回は呼ばれていること
      expect(electronAPI.cache.syncPlaylists).toHaveBeenCalled();
    });
  });

  it("should schedule retry if sync is triggered while in progress", async () => {
    // 最初の同期を遅延させて、実行中に状態を作る
    let resolveFirstSync: Function;
    const firstSyncPromise = new Promise((resolve) => {
      resolveFirstSync = resolve;
    });

    mockSupabaseFrom.mockImplementationOnce((table) => {
      if (table === "playlists") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnValue({
            then: async (resolve: Function) => {
              await firstSyncPromise; // ここで待機
              resolve({
                data: [{ id: "p1", title: "Playlist 1" }],
                error: null,
              });
            },
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: (r: any) => r({ data: [], error: null }),
      };
    });

    const { rerender } = renderHook(() => useBackgroundSync());

    // 最初の同期が開始された（が進んでいない）状態
    // ここで再度フックを実行（リトライ予約をトリガー）
    // renderHookの再レンダリングではuseEffectが再実行されないため、
    // isOnlineをトグルしてuseEffectを発火させる
    (useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: false });
    rerender();
    (useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: true });
    rerender();

    // 最初の同期を完了させる
    resolveFirstSync!();

    // 2回呼ばれることを確認（初回 + リトライ）
    await waitFor(
      () => {
        // mockSupabaseFrom は全テーブルアクセスで呼ばれるため、単純な回数ではなく
        // 初回のセット（3回）＋リトライのセット（3回）で合計6回程度になることを確認
        expect(mockSupabaseFrom.mock.calls.length).toBeGreaterThan(3);
      },
      { timeout: 3000 }
    );
  });
});
