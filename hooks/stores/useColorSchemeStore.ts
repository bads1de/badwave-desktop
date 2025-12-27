import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_COLOR_SCHEME_ID,
  getColorSchemeById,
  type ColorScheme,
} from "@/constants/colorSchemes";

interface ColorSchemeStore {
  colorSchemeId: string;
  hasHydrated: boolean;
  getColorScheme: () => ColorScheme;
  setColorScheme: (id: string) => void;
  setHasHydrated: (state: boolean) => void;
}

const useColorSchemeStore = create<ColorSchemeStore>()(
  persist(
    (set, get) => ({
      colorSchemeId: DEFAULT_COLOR_SCHEME_ID,
      hasHydrated: false,
      getColorScheme: () => getColorSchemeById(get().colorSchemeId),
      setColorScheme: (id: string) => set({ colorSchemeId: id }),
      setHasHydrated: (state: boolean) => set({ hasHydrated: state }),
    }),
    {
      name: "badwave-color-scheme",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export default useColorSchemeStore;
