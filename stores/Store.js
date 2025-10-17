import { create } from "zustand";
import * as SQLite from "expo-sqlite";

export const Store = create((set) => ({
  db: null,
  dbInitialized: false,
  setDbInitialized: (newState) => set({ dbInitialized: newState }),
  completedSetup: false,
  setCompletedSetup: (completed) => set({ completedSetup: completed }),
  dbUpToDate: false,
  setDbUpToDate: (newState) => set({ dbUpToDate: newState }),
  fetchedTransactions: [],
  setfetchedTransactions: (newState) => set({ fetchedTransactions: newState }),
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

  initDB: async () => {
    try {
      // Open DB with useNewConnection to avoid connection conflicts on re-navigation
      const db = await SQLite.openDatabaseAsync("ExpenseManager.db", {
        useNewConnection: true,
      });
      set({ db, dbInitialized: true });
      return db;
    } catch (err) {
      console.error("Error opening database:", err);
      throw err;
    }
  },
}));
