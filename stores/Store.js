import { create } from "zustand";

export const Store = create((set) => ({
  iconSize: 0,
  setIconSize: (newSize) => set({ iconSize: newSize }),
}));
