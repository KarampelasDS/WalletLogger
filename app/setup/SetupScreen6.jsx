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

// tiny delay helper
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

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

  let main = null;

  useEffect(() => {
    const handler = () => true; // block back
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

  async function insertWithRetry(query, params, name, type) {
    const maxRetries = 2;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await db.runAsync(query, params);
        await delay(5); // tiny breathing room
        return;
      } catch (e) {
        console.error(
          `❌ Failed to insert ${type} '${name}', attempt ${attempt + 1}:`,
          e
        );
        if (attempt === maxRetries) throw e;
        await delay(20);
      }
    }
  }

  async function initializeAccounts() {
    setLoading("Accounts");
    if (!db) return;
    console.log("🟦 Initializing Accounts...");
    for (let i = 0; i < setupAccounts.length; i++) {
      const acc = setupAccounts[i];
      await insertWithRetry(
        `INSERT INTO accounts (account_name, account_emoji, account_balance, account_order) VALUES (?, ?, ?, ?)`,
        [acc.name, acc.emoji, acc.balance, i],
        acc.name,
        "account"
      );
      console.log(`✅ Account inserted: ${acc.name}`);
    }
  }

  async function initializeCurrencies() {
    setLoading("Currencies");
    if (!db) return;
    console.log("🟨 Initializing Currencies...");
    for (let i = 0; i < setupCurrencies.length; i++) {
      const cur = setupCurrencies[i];
      await insertWithRetry(
        `INSERT INTO currencies (currency_name, currency_symbol, currency_shorthand, currency_order) VALUES (?, ?, ?, ?)`,
        [cur.name, cur.symbol, cur.shorthand, i],
        cur.name,
        "currency"
      );
      console.log(`✅ Currency inserted: ${cur.name}`);
    }

    const allCurrencies = await db.getAllAsync("SELECT * FROM currencies");
    main = await db.getFirstAsync(
      "SELECT * FROM currencies WHERE currency_name = ?",
      [mainCurrency?.name]
    );

    if (!main) {
      console.error(
        `❌ Main currency '${mainCurrency?.name}' not found. Defaulting to first currency.`
      );
      main = allCurrencies[0];
    }

    console.log("✅ Main currency set:", main);
    setMainCurrency(main);
  }

  async function initializeUserCurrencies() {
    setLoading("User Currency");
    if (!db || !main) return;
    console.log("🟩 Initializing User Currency...");
    await insertWithRetry(
      `INSERT INTO user_currencies (currency_id, is_main, conversion_rate_to_main, display_order) VALUES (?, ?, ?, ?)`,
      [main.currency_id, 1, 1, 0],
      main.currency_name,
      "user currency"
    );
    console.log("✅ User currency initialized:", main.currency_name);
  }

  async function initializeIncomeCategories() {
    setLoading("Income Categories");
    if (!db) return;
    console.log("🟦 Initializing Income Categories...");
    for (let i = 0; i < setupIncomeCategories.length; i++) {
      const cat = setupIncomeCategories[i];
      await insertWithRetry(
        `INSERT INTO categories (category_name, category_emoji, category_type, category_order) VALUES (?, ?, ?, ?)`,
        [cat.name, cat.emoji, "Income", i],
        cat.name,
        "income category"
      );
      console.log(`✅ Income category inserted: ${cat.name}`);
    }
  }

  async function initializeExpenseCategories() {
    setLoading("Expense Categories");
    if (!db) return;
    console.log("🟥 Initializing Expense Categories...");
    for (let i = 0; i < setupExpenseCategories.length; i++) {
      const cat = setupExpenseCategories[i];
      await insertWithRetry(
        `INSERT INTO categories (category_name, category_emoji, category_type, category_order) VALUES (?, ?, ?, ?)`,
        [cat.name, cat.emoji, "Expense", i],
        cat.name,
        "expense category"
      );
      console.log(`✅ Expense category inserted: ${cat.name}`);
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
  introText: { color: "#fff", fontSize: 30, textAlign: "center" },
  introSubText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
});
