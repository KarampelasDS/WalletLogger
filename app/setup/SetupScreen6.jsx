import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import { Store } from "../../stores/Store";
import { Ionicons } from "@expo/vector-icons";
import Button from "../../components/Button/Button";
import { useRouter } from "expo-router";

export default function SetupScreen6() {
  const router = useRouter();
  const setShowNavbar = Store((state) => state.setShowNavbar);
  const iconSize = Store((state) => state.iconSize);
  setShowNavbar(false);

  const mainCurrency = Store((state) => state.mainCurrency);
  const setupCurrencies = Store((state) => state.setupCurrencies);
  const setupIncomeCategories = Store((state) => state.setupIncomeCategories);
  const setupExpenseCategories = Store((state) => state.setupExpenseCategories);
  const setupAccounts = Store((state) => state.setupAccounts);
  const db = Store((state) => state.db);
  const [loading, setLoading] = useState("Accounts");

  const setCompletedSetup = Store((state) => state.setCompletedSetup);

  useEffect(() => {
    console.log("Main Currency:", mainCurrency);
    console.log("Income Categories:", setupIncomeCategories);
    console.log("Expense Categories:", setupExpenseCategories);
    console.log("Accounts:", setupAccounts);
  }, []);

  async function initializeAccounts() {
    if (!db) return;
    try {
      for (let i = 0; i < setupAccounts.length; i++) {
        let account = setupAccounts[i];
        console.log(
          "Inserting account:",
          account.name,
          account.emoji,
          account.balance,
          i
        );
        await db.runAsync(
          `
        INSERT INTO accounts (account_name, account_emoji, account_balance, account_order)
        VALUES (?, ?, ?, ?)
        `,
          [account.name, account.emoji, account.balance, i]
        );
      }
    } catch (error) {
      console.error("Error initializing account data:", error);
    }
  }

  async function initializeCurrencies() {
    if (!db) return;
    try {
      setLoading("Currencies");
      for (let i = 0; i < setupCurrencies.length; i++) {
        let currency = setupCurrencies[i];
        console.log("Inserting Currency:", currency.name, currency.symbol, i);
        await db.runAsync(
          `
        INSERT INTO currencies (currency_name, currency_symbol, currency_order)
        VALUES (?, ?, ?)
        `,
          [currency.name, currency.symbol, i]
        );
      }
    } catch (error) {
      console.error("Error initializing currency data:", error);
    }
  }

  async function initializeIncomeCategories() {
    if (!db) return;
    try {
      setLoading("Income Categories");
      for (let i = 0; i < setupIncomeCategories.length; i++) {
        let category = setupIncomeCategories[i];
        console.log(
          "Inserting category:",
          category.name,
          category.emoji,
          "Income",
          i
        );
        await db.runAsync(
          `
        INSERT INTO categories (category_name, category_emoji, category_type, category_order)
        VALUES (?, ?, ?, ?)
        `,
          [category.name, category.emoji, "Income", i]
        );
      }
    } catch (error) {
      console.error("Error initializing income category data:", error);
    }
  }

  async function initializeExpenseCategories() {
    if (!db) return;
    try {
      setLoading("Expense Categories");
      for (let i = 0; i < setupExpenseCategories.length; i++) {
        let category = setupExpenseCategories[i];
        console.log(
          "Inserting category:",
          category.name,
          category.emoji,
          "Expense",
          i
        );
        await db.runAsync(
          `
        INSERT INTO categories (category_name, category_emoji, category_type, category_order)
        VALUES (?, ?, ?, ?)
        `,
          [category.name, category.emoji, "Expense", i]
        );
      }
    } catch (error) {
      console.error("Error initializing expense category data:", error);
    }
  }

  useEffect(() => {
    const initialize = async () => {
      const handler = () => true;
      BackHandler.addEventListener("hardwareBackPress", handler);
      await initializeAccounts();
      await initializeCurrencies();
      await initializeIncomeCategories();
      await initializeExpenseCategories();
      setCompletedSetup(true);
      setShowNavbar(true);
      router.replace("/");
    };

    initialize();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.introText}>Initializing...</Text>
      <Text style={styles.introSubText}>Setting Up {loading}</Text>
      <ActivityIndicator size="large" color="#fff" style={{ marginTop: 32 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", flex: 1 },
  intro: {
    backgroundColor: "#2C2E42",
    padding: 20,
    borderRadius: 20,
  },
  introText: {
    color: "#fff",
    fontSize: 30,
    textAlign: "center",
  },
  introSubText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
  buttons: {
    position: "absolute",
    bottom: 0,
    marginBottom: 50,
    width: "80%",
  },
});
