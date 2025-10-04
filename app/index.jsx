import { StyleSheet, Text, View } from "react-native";
import { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import AddTransactionButton from "../components/TransactionsPage/AddTransactionButton";
import Title from "../components/Title/Title";
import { Store } from "../stores/Store";
import { openDatabaseAsync } from "expo-sqlite";

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const Home = () => {
  const currentMonth = Store((state) => state.currentDate.getMonth());
  const currentYear = Store((state) => state.currentDate.getFullYear());
  const [shownMonth, setShownMonth] = useState(currentMonth);
  const [shownYear, setShownYear] = useState(currentYear);

  useEffect(() => {
    const setupDB = async () => {
      const db = await openDatabaseAsync("ExpenseManager.db");
      await db.execAsync("PRAGMA foreign_keys = ON;");

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS currencies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
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
          category_type VARCHAR
        )
      `);

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type VARCHAR,
          amount DECIMAL,
          category_id INTEGER,
          date DATETIME,
          note VARCHAR,
          account_id INTEGER,
          currency_id INTEGER,
          FOREIGN KEY (account_id) REFERENCES accounts(account_id),
          FOREIGN KEY (category_id) REFERENCES categories(category_id),
          FOREIGN KEY (currency_id) REFERENCES currencies(id)
        )
      `);

      await db.execAsync(`
        INSERT INTO accounts (account_name, account_emoji, account_balance)
        SELECT 'Cash', '💵', 0
        WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE account_name = 'Cash')
      `);
      await db.execAsync(`
        INSERT INTO accounts (account_name, account_emoji, account_balance)
        SELECT 'Bank', '🏦', 0
        WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE account_name = 'Bank')
      `);
      await db.execAsync(`
        INSERT INTO currencies (currency_name, currency_symbol)
        SELECT 'US Dollar', '$'
        WHERE NOT EXISTS (SELECT 1 FROM currencies WHERE currency_name = 'US Dollar')
      `);
      await db.execAsync(`
        INSERT INTO currencies (currency_name, currency_symbol)
        SELECT 'Euro', '€'
        WHERE NOT EXISTS (SELECT 1 FROM currencies WHERE currency_name = 'Euro')
      `);
      await db.execAsync(`
        INSERT INTO currencies (currency_name, currency_symbol)
        SELECT 'Japanese Yen', '¥'
        WHERE NOT EXISTS (SELECT 1 FROM currencies WHERE currency_name = 'Japanese Yen')
      `);
      await db.execAsync(`
        INSERT INTO categories (category_name, category_emoji, category_type)
        SELECT 'Food', '🍔', 'Expense'
        WHERE NOT EXISTS (SELECT 1 FROM categories WHERE category_name = 'Food')
      `);
      await db.execAsync(`
        INSERT INTO categories (category_name, category_emoji, category_type)
        SELECT 'Transport', '🚗', 'Expense'
        WHERE NOT EXISTS (SELECT 1 FROM categories WHERE category_name = 'Transport')
      `);
      await db.execAsync(`
        INSERT INTO categories (category_name, category_emoji, category_type)
        SELECT 'Shopping', '🛍️', 'Expense'
        WHERE NOT EXISTS (SELECT 1 FROM categories WHERE category_name = 'Shopping')
      `);
      await db.execAsync(`
        INSERT INTO categories (category_name, category_emoji, category_type)
        SELECT 'Salary', '💼', 'Income'
        WHERE NOT EXISTS (SELECT 1 FROM categories WHERE category_name = 'Salary')
      `);
      await db.execAsync(`
        INSERT INTO categories (category_name, category_emoji, category_type)
        SELECT 'Investment', '📈', 'Income'
        WHERE NOT EXISTS (SELECT 1 FROM categories WHERE category_name = 'Investment')
      `);
      await db.execAsync(`
        INSERT INTO categories (category_name, category_emoji, category_type)
        SELECT 'Gift', '🎁', 'Income'
        WHERE NOT EXISTS (SELECT 1 FROM categories WHERE category_name = 'Gift')
      `);

      const accounts = await db.getAllAsync("SELECT * FROM accounts");
      console.log("Accounts:", accounts);
      const categories = await db.getAllAsync("SELECT * FROM categories");
      console.log("Categories:", categories);
      const currencies = await db.getAllAsync("SELECT * FROM currencies");
      console.log("Currencies:", currencies);
    };

    setupDB();
  }, []);

  return (
    <View style={styles.container}>
      <Title
        title={`${months[shownMonth]} ${shownYear}`}
        backIcon={"chevron-back-outline"}
        onPressBackIcon={() => {
          if (shownMonth === 0) {
            setShownYear((prev) => prev - 1);
            setShownMonth(11);
            return;
          }
          setShownMonth((prev) => prev - 1);
        }}
        frontIcon={"chevron-forward-outline"}
        onPressFrontIcon={() => {
          if (shownMonth === 11) {
            setShownYear((prev) => prev + 1);
            setShownMonth(0);
            return;
          }
          setShownMonth((prev) => prev + 1);
        }}
      />
      <Text style={styles.title}>Transactions Page</Text>
      <Text style={{ marginTop: 10, marginBottom: 30, color: "white" }}>
        Transactions here
      </Text>
      <AddTransactionButton />
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E1E24",
  },
  title: {
    fontWeight: "bold",
    fontSize: 18,
    color: "white",
  },
});
