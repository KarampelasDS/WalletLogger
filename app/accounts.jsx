import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useEffect, useState } from "react";
import Title from "../components/Title/Title";
import { Store } from "../stores/Store";

const Accounts = () => {
  const db = Store((state) => state.db);
  const dbInitialized = Store((state) => state.dbInitialized);
  const mainCurrency = Store((state) => state.mainCurrency);

  const [accounts, setAccounts] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!dbInitialized || !db) return;

    const fetchAccounts = async () => {
      setLoading(true);
      try {
        const result = await db.getAllAsync("SELECT * FROM accounts");
        setAccounts(result);

        let total = 0;
        result.forEach((a) => {
          total += parseFloat(a.account_balance);
        });
        setTotalBalance(total);
      } catch (e) {
        console.error("Error fetching accounts:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [dbInitialized]);

  return (
    <View style={styles.container}>
      {dbInitialized && <Title title="Accounts" showBalance={true} />}

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>Total Balance:</Text>
        <Text
          style={[
            styles.summaryValue,
            totalBalance < 0 ? { color: "#CD5D5D" } : { color: "#4EA758" },
          ]}
        >
          {totalBalance.toLocaleString("en-US", {
            maximumFractionDigits: 2,
          })}
          {mainCurrency ? mainCurrency.currency_symbol : ""}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#734BE9" />
        </View>
      ) : (
        <ScrollView
          style={{ width: "100%" }}
          contentContainerStyle={{ paddingBottom: 150 }}
        >
          {accounts.length === 0 ? (
            <Text style={{ color: "gray", textAlign: "center", marginTop: 20 }}>
              No accounts found.
            </Text>
          ) : (
            accounts.map((acc) => (
              <View key={acc.account_id} style={styles.accountCard}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={styles.accountEmoji}>{acc.account_emoji}</Text>
                  <View>
                    <Text style={styles.accountName}>{acc.account_name}</Text>
                    <Text style={styles.accountType}>{acc.account_type}</Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.accountBalance,
                    acc.account_balance < 0
                      ? { color: "#CD5D5D" }
                      : { color: "#4EA758" },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.5}
                >
                  {Number(acc.account_balance).toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                  {mainCurrency ? mainCurrency.currency_symbol : ""}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default Accounts;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1B25",
    alignItems: "center",
  },
  summaryContainer: {
    width: "90%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  summaryText: {
    color: "white",
    fontSize: 20,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  accountCard: {
    width: "90%",
    backgroundColor: "#2C2E42",
    borderRadius: 6,
    padding: 15,
    marginVertical: 6,
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  accountEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  accountName: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  accountType: {
    color: "#B0B0B0",
    fontSize: 13,
  },
  accountBalance: {
    fontSize: 18,
    fontWeight: "bold",
  },
});
