import { create } from "zustand";
import { persist } from "zustand/middleware";

// バンド構成: Spotify風 6バンド
export const EQ_BANDS = [
  { freq: 60, label: "60 Hz" },
  { freq: 150, label: "150 Hz" },
  { freq: 400, label: "400 Hz" },
  { freq: 1000, label: "1 kHz" },
  { freq: 2400, label: "2.4 kHz" },
  { freq: 15000, label: "15 kHz" },
] as const;

export type EqBand = {
  freq: number;
  gain: number;
};

export type EqPreset = {
  id: string;
  name: string;
  gains: number[]; // 各バンドのゲイン値 (6要素)
};

// プリセット定義
export const EQ_PRESETS: EqPreset[] = [
  {
    id: "flat",
    name: "Flat",
    gains: [0, 0, 0, 0, 0, 0],
  },
  {
    id: "bass-boost",
    name: "Bass Boost",
    gains: [8, 6, 2, 0, 0, 0],
  },
  {
    id: "vocal",
    name: "Vocal",
    gains: [-2, 0, 4, 6, 4, 0],
  },
  {
    id: "treble-boost",
    name: "Treble Boost",
    gains: [0, 0, 0, 2, 6, 8],
  },
  {
    id: "rock",
    name: "Rock",
    gains: [5, 3, 0, 2, 4, 6],
  },
  {
    id: "electronic",
    name: "Electronic",
    gains: [6, 4, 0, -2, 4, 6],
  },
];

const DEFAULT_BANDS: EqBand[] = EQ_BANDS.map((band) => ({
  freq: band.freq,
  gain: 0,
}));

interface EqualizerStore {
  isEnabled: boolean;
  bands: EqBand[];
  activePresetId: string;
  presets: EqPreset[];
  hasHydrated: boolean;
  setGain: (freq: number, gain: number) => void;
  setPreset: (presetId: string) => void;
  toggleEnabled: () => void;
  reset: () => void;
  setHasHydrated: (state: boolean) => void;
}

// ゲインを-12 ~ +12の範囲に制限
const clampGain = (gain: number): number => {
  return Math.max(-12, Math.min(12, gain));
};

const useEqualizerStore = create<EqualizerStore>()(
  persist(
    (set, get) => ({
      isEnabled: false,
      bands: DEFAULT_BANDS,
      activePresetId: "flat",
      presets: EQ_PRESETS,
      hasHydrated: false,

      setGain: (freq: number, gain: number) => {
        const clampedGain = clampGain(gain);
        set((state) => ({
          bands: state.bands.map((band) =>
            band.freq === freq ? { ...band, gain: clampedGain } : band
          ),
          activePresetId: "custom",
        }));
      },

      setPreset: (presetId: string) => {
        const preset = get().presets.find((p) => p.id === presetId);
        if (!preset) return;

        set((state) => ({
          activePresetId: presetId,
          bands: state.bands.map((band, index) => ({
            ...band,
            gain: preset.gains[index] ?? 0,
          })),
        }));
      },

      toggleEnabled: () => {
        set((state) => ({ isEnabled: !state.isEnabled }));
      },

      reset: () => {
        set({
          isEnabled: false,
          bands: DEFAULT_BANDS,
          activePresetId: "flat",
        });
      },

      setHasHydrated: (state: boolean) => set({ hasHydrated: state }),
    }),
    {
      name: "badwave-equalizer",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export default useEqualizerStore;
