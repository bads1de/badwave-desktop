import { create } from "zustand";
import { persist } from "zustand/middleware";

const DEFAULT_VOLUME = 0.5;

interface VolumeStore {
  volume: number;
  hasHydrated: boolean;
  setVolume: (volume: number) => void;
  setHasHydrated: (state: boolean) => void;
}

const useVolumeStore = create<VolumeStore>()(
  persist(
    (set) => ({
      volume: DEFAULT_VOLUME,
      hasHydrated: false,
      setVolume: (volume: number) =>
        set({ volume: Math.max(0, Math.min(1, volume)) }),
      setHasHydrated: (state: boolean) => set({ hasHydrated: state }),
    }),
    {
      name: "badwave-volume",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export default useVolumeStore;
