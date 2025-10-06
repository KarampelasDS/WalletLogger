import { useEffect, useState } from "react";
import * as SQLite from "expo-sqlite";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Store } from "../../stores/Store";
import { Redirect } from "expo-router";
import { openDatabaseAsync } from "expo-sqlite";

export default function setup1() {
  const setCompletedSetup = Store((state) => state.setCompletedSetup);
  const [shouldRedirect, setShouldRedirect] = useState(false);

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

    setupDB().then(() => {
      setCompletedSetup(true);
      setShouldRedirect(true);
    });
  }, []);

  if (shouldRedirect) {
    return <Redirect href="/" />;
  }

  return (
    <View>
      <Text>Setup Step 1</Text>
      <Text style={{ marginTop: 10, marginBottom: 30, color: "white" }}>
        Initializing database...
      </Text>
      <ActivityIndicator size="large" color="#ffffff" />
    </View>
  );
}
