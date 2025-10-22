import { useEffect } from "react";
import * as SQLite from "expo-sqlite";
import { openDatabaseAsync } from "expo-sqlite";
import { View, Text, StyleSheet } from "react-native";
import { Store } from "../../stores/Store";
import { Ionicons } from "@expo/vector-icons";
import Button from "../../components/Button/Button";
import { useRouter } from "expo-router";

export default function SetupScreen1() {
  const router = useRouter();
  const setShowNavbar = Store((state) => state.setShowNavbar);
  const iconSize = Store((state) => state.iconSize);
  setShowNavbar(false);

  const db = Store((state) => state.db);
  const initDB = Store((state) => state.initDB);
  const dbInitialized = Store((state) => state.dbInitialized);
  const setDbInitialized = Store((state) => state.setDbInitialized);

  useEffect(() => {
    const init = async () => {
      if (!dbInitialized) {
        await initDB();
        setDbInitialized(true);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const createTables = async () => {
      await db.execAsync("PRAGMA foreign_keys = ON;");

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS currencies (
          currency_id INTEGER PRIMARY KEY AUTOINCREMENT,
          currency_name VARCHAR,
          currency_symbol VARCHAR
        )
      `);

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS accounts (
          account_id INTEGER PRIMARY KEY AUTOINCREMENT,
          account_name VARCHAR,
          account_emoji VARCHAR,
          account_balance DECIMAL
        )
      `);

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS categories (
          category_id INTEGER PRIMARY KEY AUTOINCREMENT,
          category_name VARCHAR,
          category_emoji VARCHAR,
          category_type VARCHAR,
          category_order INTEGER
        )
      `);

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS transactions (
          transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
          transaction_type VARCHAR,
          transaction_amount DECIMAL,
          category_id INTEGER,
          transaction_date DATETIME,
          transaction_note VARCHAR,
          account_id INTEGER,
          account_from_id INTEGER,
          account_to_id INTEGER,
          currency_id INTEGER,
          FOREIGN KEY (account_id) REFERENCES accounts(account_id),
          FOREIGN KEY (account_from_id) REFERENCES accounts(account_id),
          FOREIGN KEY (account_to_id) REFERENCES accounts(account_id),
          FOREIGN KEY (category_id) REFERENCES categories(category_id),
          FOREIGN KEY (currency_id) REFERENCES currencies(currency_id)
        )
      `);

      const accounts = await db.getAllAsync("SELECT * FROM accounts");
      console.log("Accounts:", accounts);
      const categories = await db.getAllAsync("SELECT * FROM categories");
      console.log("Categories:", categories);
      const currencies = await db.getAllAsync("SELECT * FROM currencies");
      console.log("Currencies:", currencies);
    };

    createTables();
  }, []);

  return (
    <View style={styles.container}>
      <Ionicons
        style={styles.intro}
        name="wallet-outline"
        size={iconSize + 150}
        color="#fff"
      />
      <Text style={styles.introText}>Welcome to Wallet Logger</Text>
      <Text style={styles.introSubText}>Your all-in-one expense manager!</Text>
      <View style={styles.buttons}>
        <Button
          enabled={true}
          function={() => router.push("/setup/SetupScreen2")}
          backgroundColor={"#2C2E42"}
          disabledColor={"#33343fff"}
        >
          Get Started!
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", flex: 1 },
  intro: {
    backgroundColor: "#2C2E42",
    padding: 20,
    borderRadius: 20,
    marginTop: "-40%",
  },
  introText: {
    color: "#fff",
    fontSize: 30,
    textAlign: "center",
    marginTop: 50,
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
