import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PlaybackRateStore {
  rate: number;
  hasHydrated: boolean;
  setRate: (rate: number) => void;
  setHasHydrated: (state: boolean) => void;
}

const usePlaybackRateStore = create<PlaybackRateStore>()(
  persist(
    (set) => ({
      rate: 1.0,
      hasHydrated: false,
      setRate: (rate) => set({ rate }),
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
