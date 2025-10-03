import { create } from "zustand";

export const Store = create((set) => ({
  iconSize: 0,
  setIconSize: (newSize) => set({ iconSize: newSize }),
  currentTransaction: null,
  setCurrentTransaction: (transaction) =>
    set({ currentTransaction: transaction }),
  currentDate: new Date(),
  setCurrentDate: (date) => set({ currentDate: date }),
}));
