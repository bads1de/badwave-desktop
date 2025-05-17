import { create } from "zustand";

interface UserStore {
  user: any | null;
  userDetails: any | null;
  setUser: (user: any | null) => void;
  setUserDetails: (userDetails: any | null) => void;
}

export const useUser = create<UserStore>((set) => ({
  user: null,
  userDetails: null,
  setUser: (user) => set({ user }),
  setUserDetails: (userDetails) => set({ userDetails }),
}));
