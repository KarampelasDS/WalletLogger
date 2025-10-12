import { create } from "zustand";
import * as SQLite from "expo-sqlite";

export const Store = create((set) => ({
  db: null,
  completedSetup: false,
  setCompletedSetup: (completed) => set({ completedSetup: completed }),
  iconSize: 0,
  dimensions: null,
  setDimensions: (newWidth, newHeight) =>
    set({ dimensions: { width: newWidth, height: newHeight } }),
  setIconSize: (newSize) => set({ iconSize: newSize }),
  currentTransaction: null,
  setCurrentTransaction: (transaction) =>
    set({ currentTransaction: transaction }),
  currentDate: new Date(),
  setCurrentDate: (date) => set({ currentDate: date }),
  showNavbar: true,
  setShowNavbar: (show) => set({ showNavbar: show }),

  // add an async init function
  initDB: async () => {
    const db = await SQLite.openDatabaseAsync("ExpenseManager.db");
    set({ db });
    return db;
  },
}));
