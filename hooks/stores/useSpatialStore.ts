import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SpatialStore {
  isSpatialEnabled: boolean;
  toggleSpatialEnabled: () => void;
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

const useSpatialStore = create<SpatialStore>()(
  persist(
    (set) => ({
      isSpatialEnabled: false,
      toggleSpatialEnabled: () =>
        set((state) => ({ isSpatialEnabled: !state.isSpatialEnabled })),
      hasHydrated: false,
      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: "badwave-spatial-store",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export default useSpatialStore;
