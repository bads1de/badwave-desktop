import { useDebounce as useDebounceLib } from "use-debounce";

/**
 * 値のデバウンスを行うカスタムフック
 * use-debounce ライブラリを使用して実装を統一
 *
 * @param value デバウンスする値
 * @param delay 遅延時間 (ms)
 * @returns デバウンスされた値
 */
function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue] = useDebounceLib(value, delay);
  return debouncedValue;
}

export default useDebounce;
