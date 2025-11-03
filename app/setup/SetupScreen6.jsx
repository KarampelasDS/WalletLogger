import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import { Store } from "../../stores/Store";
import { useRouter } from "expo-router";

export default function SetupScreen6() {
  const router = useRouter();

  const setShowNavbar = Store((state) => state.setShowNavbar);
  const mainCurrency = Store((state) => state.mainCurrency);
  const setMainCurrency = Store((state) => state.setMainCurrency);
  const setupCurrencies = Store((state) => state.setupCurrencies);
  const setupIncomeCategories = Store((state) => state.setupIncomeCategories);
  const setupExpenseCategories = Store((state) => state.setupExpenseCategories);
  const setupAccounts = Store((state) => state.setupAccounts);
  const db = Store((state) => state.db);
  const setCompletedSetup = Store((state) => state.setCompletedSetup);

  const [loading, setLoading] = useState("Accounts");

  let main = null; // persist main currency reference

  useEffect(() => {
    const handler = () => true; // still block user navigation
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      handler
    );
    setShowNavbar(false);

    const initialize = async () => {
      console.log("🟢 Starting Setup Initialization...");
      if (!db) {
        console.error("❌ Database not ready.");
        return;
      }

      try {
        await initializeAccounts();
        await initializeCurrencies();
        await initializeUserCurrencies();
        await initializeIncomeCategories();
        await initializeExpenseCategories();

        console.log("✅ All setup steps completed successfully!");
        setCompletedSetup(true);
      } catch (err) {
        console.error("❌ Setup failed:", err);
      } finally {
        subscription.remove();
        setShowNavbar(true);
        router.replace("/");
      }
    };

    initialize();
  }, []);

  async function initializeAccounts() {
    setLoading("Accounts");
    if (!db) return;

    console.log("🟦 Initializing Accounts...");
    try {
      for (let i = 0; i < setupAccounts.length; i++) {
        const account = setupAccounts[i];
        try {
          await db.runAsync(
            `INSERT INTO accounts (account_name, account_emoji, account_balance, account_order)
             VALUES (?, ?, ?, ?)`,
            [account.name, account.emoji, account.balance, i]
          );
        } catch (e) {
          console.error(`❌ Failed to insert account '${account.name}':`, e);
        }
      }
      const count = await db.getAllAsync("SELECT COUNT(*) as c FROM accounts");
      console.log(
        `✅ Inserted ${count[0].c} / ${setupAccounts.length} accounts.`
      );
    } catch (err) {
      console.error("❌ Account setup error:", err);
    }
  }

  async function initializeCurrencies() {
    setLoading("Currencies");
    if (!db) return;

    console.log("🟨 Initializing Currencies...");
    try {
      for (let i = 0; i < setupCurrencies.length; i++) {
        const currency = setupCurrencies[i];
        try {
          await db.runAsync(
            `INSERT INTO currencies (currency_name, currency_symbol, currency_shorthand, currency_order)
             VALUES (?, ?, ?, ?)`,
            [currency.name, currency.symbol, currency.shorthand, i]
          );
        } catch (e) {
          console.error(`❌ Failed to insert currency '${currency.name}':`, e);
        }
      }

      const allCurrencies = await db.getAllAsync("SELECT * FROM currencies");
      console.log(
        `✅ Inserted ${allCurrencies.length} / ${setupCurrencies.length} currencies.`
      );

      main = await db.getFirstAsync(
        `SELECT * FROM currencies WHERE currency_name = ?`,
        [mainCurrency?.name]
      );

      if (!main) {
        console.error(
          `❌ Main currency not found: '${mainCurrency?.name}'. Available:`,
          allCurrencies.map((c) => c.currency_name)
        );
        throw new Error("Main currency lookup failed");
      }

      console.log("✅ Main currency found:", main);
      setMainCurrency(main);
    } catch (err) {
      console.error("❌ Currency setup error:", err);
    }
  }

  async function initializeUserCurrencies() {
    setLoading("User Currency");
    if (!db) return;
    if (!main) {
      console.error("❌ Cannot insert user currency — main is null.");
      return;
    }

    console.log("🟩 Initializing User Currency...");
    try {
      await db.runAsync(
        `INSERT INTO user_currencies (currency_id, is_main, conversion_rate_to_main, display_order)
         VALUES (?, ?, ?, ?)`,
        [main.currency_id, 1, 1, 0]
      );

      const allUserCurrencies = await db.getAllAsync(
        "SELECT * FROM user_currencies"
      );
      console.log("✅ User currencies now:", allUserCurrencies.length);
    } catch (err) {
      console.error("❌ User currency setup error:", err);
    }
  }

  async function initializeIncomeCategories() {
    setLoading("Income Categories");
    if (!db) return;

    console.log("🟦 Initializing Income Categories...");
    try {
      for (let i = 0; i < setupIncomeCategories.length; i++) {
        const category = setupIncomeCategories[i];
        try {
          await db.runAsync(
            `INSERT INTO categories (category_name, category_emoji, category_type, category_order)
             VALUES (?, ?, ?, ?)`,
            [category.name, category.emoji, "Income", i]
          );
        } catch (e) {
          console.error(
            `❌ Failed to insert income category '${category.name}':`,
            e
          );
        }
      }
      const count = await db.getAllAsync(
        "SELECT COUNT(*) as c FROM categories WHERE category_type = 'Income'"
      );
      console.log(
        `✅ Inserted ${count[0].c} / ${setupIncomeCategories.length} income categories.`
      );
    } catch (err) {
      console.error("❌ Income category setup error:", err);
    }
  }

  async function initializeExpenseCategories() {
    setLoading("Expense Categories");
    if (!db) return;

    console.log("🟥 Initializing Expense Categories...");
    try {
      for (let i = 0; i < setupExpenseCategories.length; i++) {
        const category = setupExpenseCategories[i];
        try {
          await db.runAsync(
            `INSERT INTO categories (category_name, category_emoji, category_type, category_order)
             VALUES (?, ?, ?, ?)`,
            [category.name, category.emoji, "Expense", i]
          );
        } catch (e) {
          console.error(
            `❌ Failed to insert expense category '${category.name}':`,
            e
          );
        }
      }
      const count = await db.getAllAsync(
        "SELECT COUNT(*) as c FROM categories WHERE category_type = 'Expense'"
      );
      console.log(
        `✅ Inserted ${count[0].c} / ${setupExpenseCategories.length} expense categories.`
      );
    } catch (err) {
      console.error("❌ Expense category setup error:", err);
    }
  }

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
});
