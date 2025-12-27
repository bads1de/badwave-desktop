"use client";

import { create } from "zustand";

interface PulseUploadModalStore {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const usePulseUploadModal = create<PulseUploadModalStore>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));

export default usePulseUploadModal;
