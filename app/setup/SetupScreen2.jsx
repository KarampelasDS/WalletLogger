import { View, Text, StyleSheet } from "react-native";
import { Store } from "../../stores/Store";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import Toast from "react-native-toast-message";
import Button from "../../components/Button/Button";
import SelectionScroller from "../../components/SelectionScroller/SelectionScroller";
import ScrollerOption from "../../components/SelectionScroller/ScrollerOption";
import * as SQLite from "expo-sqlite";

export default function SetupScreen2() {
  const router = useRouter();
  const setShowNavbar = Store((state) => state.setShowNavbar);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const db = Store((state) => state.db);
  const setMainCurrency = Store((state) => state.setMainCurrency);
  setShowNavbar(false);

  const setSetupCurrencies = Store((state) => state.setSetupCurrencies);

  useEffect(() => {
    if (!db) return;

    const createTables = async () => {
      await db.execAsync("PRAGMA foreign_keys = ON;");

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS currencies (
          currency_id INTEGER PRIMARY KEY AUTOINCREMENT,
          currency_name VARCHAR,
          currency_symbol VARCHAR,
          currency_shorthand VARCHAR,
          currency_order INTEGER
        )
      `);

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS user_currencies(
        user_currency_id INTEGER PRIMARY KEY AUTOINCREMENT,
        currency_id INTEGER NOT NULL,
        is_main BOOLEAN DEFAULT 0,
        conversion_rate_to_main DECIMAL,
        display_order INTEGER,
          currency_snapshot_name VARCHAR,    -- snapshot of the currency's name
  currency_snapshot_symbol VARCHAR,  -- snapshot of the currency's symbol
        FOREIGN KEY (currency_id) REFERENCES currencies(currency_id)
        )
      `);

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS accounts (
          account_id INTEGER PRIMARY KEY AUTOINCREMENT,
          account_name VARCHAR,
          account_emoji VARCHAR,
          account_balance DECIMAL,
          account_order INTEGER
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
    transaction_id INTEGER PRIMARY KEY AUTOINCREMENT, -- unique Transaction ID
    transaction_type VARCHAR,                         -- income/expense/transfer
    transaction_amount DECIMAL,                       -- base amount
    category_id INTEGER,                              -- category reference
    category_emoji_snapshot VARCHAR,                  -- snapshot of category emoji (in case it gets deleted)
    category_name_snapshot VARCHAR,                   -- snapshot of category name (in case it gets deleted)
    transaction_date DATETIME,                        -- when the transaction happened
    transaction_note VARCHAR,                         -- optional user note
    account_id INTEGER,                               -- from which account
    account_snapshot_emoji VARCHAR,                   -- snapshot of account emoji (in case it gets deleted)
    account_snapshot_name VARCHAR,                    -- snapshot of account name (in case it gets deleted)
    account_from_id INTEGER,                          -- source account for transfers
    account_from_snapshot_emoji VARCHAR,              -- snapshot of account emoji (in case of deletion)
    account_from_snapshot_name VARCHAR,               -- snapshot of account name (in case it gets deleted)
    account_to_id INTEGER,                            -- destination account for transfers
    account_to_snapshot_emoji VARCHAR,                -- snapshot of account emoji (in case of deletion)
    account_to_snapshot_name VARCHAR,                 -- snapshot of account name (in case it gets deleted)
    currency_id INTEGER,                              -- currency of the transaction
    currency_snapshot_name VARCHAR,                   -- snapshot of currency name (in case it gets deleted)
    currency_snapshot_symbol VARCHAR,                 -- snapshot of currency symbol (in case it gets deleted)
    converted_from_currency_id INTEGER,               -- original currency before conversion
    transaction_secondCurrencyAmount DECIMAL,         -- amount in secondary currency
    exchange_rate DECIMAL,                            -- rate used for conversion

    FOREIGN KEY (account_id) REFERENCES accounts(account_id),
    FOREIGN KEY (account_from_id) REFERENCES accounts(account_id),
    FOREIGN KEY (account_to_id) REFERENCES accounts(account_id),
    FOREIGN KEY (category_id) REFERENCES categories(category_id),
    FOREIGN KEY (currency_id) REFERENCES currencies(currency_id),
    FOREIGN KEY (converted_from_currency_id) REFERENCES currencies(currency_id)
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
  }, [db]);

  const currencies = [
    { name: "Euro", symbol: "€", shorthand: "EUR" },
    { name: "US Dollar", symbol: "$", shorthand: "USD" },
    { name: "British Pound", symbol: "£", shorthand: "GBP" },
    { name: "Japanese Yen", symbol: "¥", shorthand: "JPY" },
    { name: "Swiss Franc", symbol: "CHF", shorthand: "CHF" },
    { name: "Canadian Dollar", symbol: "C$", shorthand: "CAD" },
    { name: "Australian Dollar", symbol: "A$", shorthand: "AUD" },
    { name: "Chinese Yuan", symbol: "CN¥", shorthand: "CNY" },
    { name: "Indian Rupee", symbol: "₹", shorthand: "INR" },
    { name: "Mexican Peso", symbol: "MX$", shorthand: "MXN" },
    { name: "Brazilian Real", symbol: "R$", shorthand: "BRL" },
    { name: "Russian Ruble", symbol: "₽", shorthand: "RUB" },
    { name: "Polish Złoty", symbol: "zł", shorthand: "PLN" },
    { name: "Czech Koruna", symbol: "Kč", shorthand: "CZK" },
    { name: "Hungarian Forint", symbol: "Ft", shorthand: "HUF" },
    { name: "Danish Krone", symbol: "kr", shorthand: "DKK" },
    { name: "Swedish Krona", symbol: "kr", shorthand: "SEK" },
    { name: "Norwegian Krone", symbol: "kr", shorthand: "NOK" },
    { name: "Icelandic Króna", symbol: "kr", shorthand: "ISK" },
    { name: "Bulgarian Lev", symbol: "лв", shorthand: "BGN" },
    { name: "Romanian Leu", symbol: "lei", shorthand: "RON" },
    { name: "Turkish Lira", symbol: "₺", shorthand: "TRY" },
    { name: "Israeli Shekel", symbol: "₪", shorthand: "ILS" },
    { name: "South African Rand", symbol: "R", shorthand: "ZAR" },
    { name: "Singapore Dollar", symbol: "S$", shorthand: "SGD" },
    { name: "New Zealand Dollar", symbol: "NZ$", shorthand: "NZD" },
    { name: "South Korean Won", symbol: "₩", shorthand: "KRW" },
    { name: "Honk Kong Dollar", symbol: "HK$", shorthand: "HKD" },
    { name: "Croatian Kuna", symbol: "kn", shorthand: "HRK" },
    { name: "Indonesian Rupiah", symbol: "Rp", shorthand: "IDR" },
    { name: "Malaysian Ringgit", symbol: "RM", shorthand: "MYR" },
    { name: "Philippine Peso", symbol: "₱", shorthand: "PHP" },
    { name: "Thai Baht", symbol: "฿", shorthand: "THB" },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.introText}>What is your main currency?</Text>
      <Text style={styles.introSubText}>You can always change this later</Text>

      <SelectionScroller>
        {currencies.map((currency, index) => (
          <ScrollerOption
            key={currency.name}
            active={selectedCurrency?.name === currency.name}
            function={() => setSelectedCurrency(currency)}
            style={[
              styles.option,
              selectedCurrency?.name === currency.name && styles.optionActive,
              index === 0 && styles.optionFirst,
              index === currencies.length - 1 && styles.optionLast,
            ]}
          >
            <View style={styles.currencyRow}>
              <Text style={styles.optionSymbol}>{currency.symbol}</Text>
              <Text style={styles.optionText}>{currency.name}</Text>
            </View>
          </ScrollerOption>
        ))}
      </SelectionScroller>

      <View style={styles.buttons}>
        <Button
          functionDisabled={() => {
            Toast.show({
              type: "error",
              text1: "Make sure you select a currency before continuing",
            });
          }}
          function={() => {
            setMainCurrency(selectedCurrency);
            setSetupCurrencies(currencies);
            router.replace("/setup/SetupScreen3");
          }}
          backgroundColor={"#2C2E42"}
          disabledColor={"#33343fff"}
          enabled={!!selectedCurrency}
        >
          Next
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", flex: 1 },
  introText: {
    color: "#fff",
    fontSize: 28,
    textAlign: "center",
    marginTop: "10%",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  introSubText: {
    color: "#b5b5b5",
    fontSize: 16,
    textAlign: "center",
    marginTop: 12,
  },
  option: {
    width: "85%",
    marginVertical: 6,
    backgroundColor: "#2C2E42",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    alignSelf: "center",
  },
  currencyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  optionSymbol: {
    color: "#9ac9e3",
    fontSize: 22,
    fontWeight: "600",
    width: "auto",
    textAlign: "center",
  },
  optionText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "500",
    width: "auto",
  },
  optionActive: {
    backgroundColor: "#3C4360",
    borderWidth: 1.5,
    borderColor: "#42A5F5",
    shadowColor: "#42A5F5",
    shadowOpacity: 0.4,
  },
  optionFirst: { marginTop: 14 },
  optionLast: { marginBottom: 20 },
  buttons: {
    position: "absolute",
    bottom: 0,
    marginBottom: 50,
    width: "80%",
  },
});
