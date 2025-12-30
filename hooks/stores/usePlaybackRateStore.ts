import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PlaybackRateStore {
  rate: number;
  isSlowedReverb: boolean;
  hasHydrated: boolean;
  setRate: (rate: number) => void;
  setIsSlowedReverb: (state: boolean) => void;
  setHasHydrated: (state: boolean) => void;
}

const usePlaybackRateStore = create<PlaybackRateStore>()(
  persist(
    (set) => ({
      rate: 1.0,
      isSlowedReverb: false,
      hasHydrated: false,
      setRate: (rate) => set({ rate }),
      setIsSlowedReverb: (isSlowedReverb) => set({ isSlowedReverb }),
      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: "badwave-playback-rate",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export default usePlaybackRateStore;
