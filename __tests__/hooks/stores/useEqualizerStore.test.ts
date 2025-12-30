/**
 * @jest-environment jsdom
 */
import useEqualizerStore, {
  EqBand,
  EqPreset,
} from "@/hooks/stores/useEqualizerStore";

// テスト前にストアをリセット
beforeEach(() => {
  useEqualizerStore.getState().reset();
});

describe("useEqualizerStore", () => {
  describe("初期状態", () => {
    it("デフォルトでイコライザーは無効", () => {
      const { isEnabled } = useEqualizerStore.getState();
      expect(isEnabled).toBe(false);
    });

    it("デフォルトで6バンドが0dBで設定されている", () => {
      const { bands } = useEqualizerStore.getState();

      expect(bands).toHaveLength(6);
      bands.forEach((band: EqBand) => {
        expect(band.gain).toBe(0);
      });
    });

    it("デフォルトでFlatプリセットが選択されている", () => {
      const { activePresetId } = useEqualizerStore.getState();
      expect(activePresetId).toBe("flat");
    });

    it("プリセットリストが存在する", () => {
      const { presets } = useEqualizerStore.getState();

      expect(presets.length).toBeGreaterThan(0);
      expect(presets.some((p: EqPreset) => p.id === "flat")).toBe(true);
      expect(presets.some((p: EqPreset) => p.id === "bass-boost")).toBe(true);
      expect(presets.some((p: EqPreset) => p.id === "vocal")).toBe(true);
    });
  });

  describe("setGain", () => {
    it("特定の周波数のゲインを変更できる", () => {
      useEqualizerStore.getState().setGain(60, 6);

      const { bands } = useEqualizerStore.getState();
      const band60Hz = bands.find((b: EqBand) => b.freq === 60);
      expect(band60Hz?.gain).toBe(6);
    });

    it("ゲイン変更時にプリセットがカスタムに変わる", () => {
      useEqualizerStore.getState().setGain(1000, 3);

      const { activePresetId } = useEqualizerStore.getState();
      expect(activePresetId).toBe("custom");
    });

    it("ゲインが-12dB ~ +12dBの範囲に制限される", () => {
      useEqualizerStore.getState().setGain(60, 20);
      expect(
        useEqualizerStore.getState().bands.find((b: EqBand) => b.freq === 60)
          ?.gain
      ).toBe(12);

      useEqualizerStore.getState().setGain(60, -20);
      expect(
        useEqualizerStore.getState().bands.find((b: EqBand) => b.freq === 60)
          ?.gain
      ).toBe(-12);
    });
  });

  describe("setPreset", () => {
    it("Bass Boostプリセットを適用できる", () => {
      useEqualizerStore.getState().setPreset("bass-boost");

      const { activePresetId, bands } = useEqualizerStore.getState();
      expect(activePresetId).toBe("bass-boost");
      // 低音域がブーストされていることを確認
      const band60Hz = bands.find((b: EqBand) => b.freq === 60);
      expect(band60Hz?.gain).toBeGreaterThan(0);
    });

    it("Vocalプリセットを適用できる", () => {
      useEqualizerStore.getState().setPreset("vocal");

      const { activePresetId, bands } = useEqualizerStore.getState();
      expect(activePresetId).toBe("vocal");
      // 中音域がブーストされていることを確認
      const band1kHz = bands.find((b: EqBand) => b.freq === 1000);
      expect(band1kHz?.gain).toBeGreaterThan(0);
    });

    it("Flatプリセットで全バンドが0dBになる", () => {
      // まず別のプリセットを適用
      useEqualizerStore.getState().setPreset("bass-boost");
      // Flatに戻す
      useEqualizerStore.getState().setPreset("flat");

      const { activePresetId, bands } = useEqualizerStore.getState();
      expect(activePresetId).toBe("flat");
      bands.forEach((band: EqBand) => {
        expect(band.gain).toBe(0);
      });
    });
  });

  describe("toggleEnabled", () => {
    it("イコライザーのON/OFFを切り替えできる", () => {
      expect(useEqualizerStore.getState().isEnabled).toBe(false);

      useEqualizerStore.getState().toggleEnabled();
      expect(useEqualizerStore.getState().isEnabled).toBe(true);

      useEqualizerStore.getState().toggleEnabled();
      expect(useEqualizerStore.getState().isEnabled).toBe(false);
    });
  });

  describe("reset", () => {
    it("設定をデフォルトにリセットできる", () => {
      // 設定を変更
      useEqualizerStore.getState().setPreset("bass-boost");
      useEqualizerStore.getState().toggleEnabled();

      // リセット
      useEqualizerStore.getState().reset();

      const { isEnabled, activePresetId, bands } = useEqualizerStore.getState();
      expect(isEnabled).toBe(false);
      expect(activePresetId).toBe("flat");
      bands.forEach((band: EqBand) => {
        expect(band.gain).toBe(0);
      });
    });
  });
});
