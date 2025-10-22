import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as SQLite from "expo-sqlite";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const Store = create(
  persist(
    (set) => ({
      db: null,
      dbInitialized: false,
      setDbInitialized: (newState) => set({ dbInitialized: newState }),

      // setup states
      setupIncomeCategories: [],
      setSetupIncomeCategories: (newState) =>
        set({ setupIncomeCategories: newState }),

      setupExpenseCategories: [],
      setSetupExpenseCategories: (newState) =>
        set({ setupExpenseCategories: newState }),

      setupAccounts: [],
      setSetupAccounts: (newState) => set({ setupAccounts: newState }),

      setupCurrencies: [],
      setSetupCurrencies: (newState) => set({ setupCurrencies: newState }),

      mainCurrency: null,
      setMainCurrency: (currency) => set({ mainCurrency: currency }),

      completedSetup: null,
      setCompletedSetup: (completed) => set({ completedSetup: completed }),

      dbUpToDate: false,
      setDbUpToDate: (newState) => set({ dbUpToDate: newState }),

      fetchedTransactions: [],
      setfetchedTransactions: (newState) =>
        set({ fetchedTransactions: newState }),

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
    }),
    {
      name: "expense-manager-store", // storage key for AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist selected keys
        completedSetup: state.completedSetup,
        mainCurrency: state.mainCurrency,
        setupAccounts: state.setupAccounts,
        setupIncomeCategories: state.setupIncomeCategories,
        setupExpenseCategories: state.setupExpenseCategories,
      }),
    }
  )
);
