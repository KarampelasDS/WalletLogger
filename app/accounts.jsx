import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useEffect, useState } from "react";
import Title from "../components/Title/Title";
import { Store } from "../stores/Store";
import { useRouter } from "expo-router";
import { fmtAmount } from "../utils/format";


const Accounts = () => {
  const db = Store((state) => state.db);
  const dbInitialized = Store((state) => state.dbInitialized);
  const mainCurrency = Store((state) => state.mainCurrency);
  const router = useRouter();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!dbInitialized || !db) return;

    const fetchAccounts = async () => {
      setLoading(true);
      try {
        const result = await db.getAllAsync("SELECT * FROM accounts");
        setAccounts(result);
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
              <TouchableOpacity
                key={acc.account_id}
                onPress={() => router.push(`/accounts/${acc.account_id}`)}
                activeOpacity={0.75}
              >
              <View style={styles.accountCard}>
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
                >
                  {fmtAmount(acc.account_balance)}
                  {mainCurrency ? mainCurrency.currency_symbol : ""}
                </Text>
              </View>
              </TouchableOpacity>
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
