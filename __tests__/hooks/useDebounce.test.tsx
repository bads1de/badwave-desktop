import { renderHook, act } from "@testing-library/react";
import useDebounce from "@/hooks/utils/useDebounce";

jest.useFakeTimers();

describe("useDebounce", () => {
  it("値が指定された時間後に更新される", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "initial", delay: 500 },
      }
    );

    expect(result.current).toBe("initial");

    // 値を変更
    rerender({ value: "updated", delay: 500 });

    // まだ更新されていないはず
    expect(result.current).toBe("initial");

    // 時間を進める
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe("updated");
  });

  it("連続して値が変更された場合、最後の値が採用される", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "initial", delay: 500 },
      }
    );

    rerender({ value: "update-1", delay: 500 });
    act(() => {
      jest.advanceTimersByTime(250);
    });
    expect(result.current).toBe("initial");

    rerender({ value: "update-2", delay: 500 });
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe("update-2");
  });
});
