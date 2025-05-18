import { create } from 'zustand';

interface LyricsStore {
  showLyrics: boolean;
  toggleLyrics: () => void;
}

const useLyricsStore = create<LyricsStore>((set) => ({
  showLyrics: false,
  toggleLyrics: () => set((state) => ({ showLyrics: !state.showLyrics })),
}));

export default useLyricsStore;