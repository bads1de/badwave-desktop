import { act } from "@testing-library/react";
import usePlayer from "@/hooks/player/usePlayer";

describe("usePlayer (Zustand Store)", () => {
  beforeEach(() => {
    act(() => {
      usePlayer.getState().reset();
    });
  });

  it("初期状態が正しい", () => {
    const state = usePlayer.getState();
    expect(state.ids).toEqual([]);
    expect(state.activeId).toBeUndefined();
    expect(state.isRepeating).toBe(false);
    expect(state.isShuffling).toBe(false);
  });

  it("IDを設定できる", () => {
    act(() => {
      usePlayer.getState().setId("song-1");
    });
    expect(usePlayer.getState().activeId).toBe("song-1");
  });

  it("IDリストを設定できる", () => {
    const ids = ["song-1", "song-2", "song-3"];
    act(() => {
      usePlayer.getState().setIds(ids);
    });
    expect(usePlayer.getState().ids).toEqual(ids);
  });

  it("リピート状態を切り替えられる", () => {
    act(() => {
      usePlayer.getState().toggleRepeat();
    });
    expect(usePlayer.getState().isRepeating).toBe(true);
    act(() => {
      usePlayer.getState().toggleRepeat();
    });
    expect(usePlayer.getState().isRepeating).toBe(false);
  });

  it("次の曲のIDを正しく取得できる", () => {
    const ids = ["song-1", "song-2", "song-3"];
    act(() => {
      usePlayer.getState().setIds(ids);
      usePlayer.getState().setId("song-1");
    });

    expect(usePlayer.getState().getNextSongId()).toBe("song-2");

    act(() => {
      usePlayer.getState().setId("song-3");
    });

    // 最後の曲の次は最初の曲（ループ）
    expect(usePlayer.getState().getNextSongId()).toBe("song-1");
  });

  it("リピート時は次の曲も同じIDになる", () => {
    const ids = ["song-1", "song-2"];
    act(() => {
      usePlayer.getState().setIds(ids);
      usePlayer.getState().setId("song-1");
      usePlayer.getState().toggleRepeat();
    });

    expect(usePlayer.getState().getNextSongId()).toBe("song-1");
  });

  it("シャッフル状態を切り替えられる", () => {
    const ids = ["song-1", "song-2", "song-3", "song-4", "song-5"];
    act(() => {
      usePlayer.getState().setIds(ids);
      usePlayer.getState().toggleShuffle();
    });

    const state = usePlayer.getState();
    expect(state.isShuffling).toBe(true);
    expect(state.shuffledIds).toHaveLength(ids.length);
    expect(state.shuffledIds).not.toEqual(ids); // ほぼ確実に順番が変わる（5曲あれば）
    // IDsの中身が漏れなく含まれていることを確認
    expect(new Set(state.shuffledIds)).toEqual(new Set(ids));
  });

  it("前の曲のIDを正しく取得できる", () => {
    const ids = ["song-1", "song-2", "song-3"];
    act(() => {
      usePlayer.getState().setIds(ids);
      usePlayer.getState().setId("song-2");
    });

    expect(usePlayer.getState().getPreviousSongId()).toBe("song-1");

    act(() => {
      usePlayer.getState().setId("song-1");
    });

    // 最初の曲の前は最後の曲
    expect(usePlayer.getState().getPreviousSongId()).toBe("song-3");
  });
});
