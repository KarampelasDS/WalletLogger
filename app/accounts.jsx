import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import Title from "../components/Title/Title";
import InfoTip from "../components/InfoTip/InfoTip";
import { Store } from "../stores/Store";
import { useRouter } from "expo-router";
import { fmtAmount } from "../utils/format";

const Accounts = () => {
  const db = Store((state) => state.db);
  const dbInitialized = Store((state) => state.dbInitialized);
  const mainCurrency = Store((state) => state.mainCurrency);
  const currentDate = Store((state) => state.currentDate);
  const router = useRouter();

  const [accounts, setAccounts] = useState([]);
  const [monthFlow, setMonthFlow] = useState({ inc: 0, exp: 0 });
  const [monthByAccount, setMonthByAccount] = useState({});
  const [loading, setLoading] = useState(false);

  const sym = mainCurrency ? mainCurrency.currency_symbol : "";

  useEffect(() => {
    if (!dbInitialized || !db) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await db.getAllAsync(
          "SELECT * FROM accounts ORDER BY account_order ASC"
        );
        setAccounts(result);

        const d = new Date(currentDate);
        const y = String(d.getFullYear());
        const m = String(d.getMonth() + 1).padStart(2, "0");

        // This-month transactions → overall flow + per-account net
        const rows = await db.getAllAsync(
          `SELECT transaction_type, account_id, account_from_id, account_to_id,
                  COALESCE(transaction_secondCurrencyAmount, transaction_amount) as amt
           FROM transactions
           WHERE strftime('%Y',transaction_date)='${y}' AND strftime('%m',transaction_date)='${m}'`
        );

        let inc = 0, exp = 0;
        const map = {};
        const add = (id, v) => { if (id != null) map[id] = (map[id] || 0) + v; };
        rows.forEach((r) => {
          const amt = parseFloat(r.amt) || 0;
          if (r.transaction_type === "Income") { inc += amt; add(r.account_id, amt); }
          else if (r.transaction_type === "Expense") { exp += amt; add(r.account_id, -amt); }
          else if (r.transaction_type === "Transfer") {
            add(r.account_to_id, amt);
            add(r.account_from_id, -amt);
          }
        });
        setMonthFlow({ inc, exp });
        setMonthByAccount(map);
      } catch (e) {
        console.error("Error fetching accounts:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dbInitialized]);

  const totalAssets = accounts.reduce((s, a) => s + parseFloat(a.account_balance), 0);
  const monthNet = monthFlow.inc - monthFlow.exp;

  return (
    <View style={styles.container}>
      {dbInitialized && <Title title="Accounts" />}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#734BE9" />
        </View>
      ) : (
        <ScrollView
          style={{ width: "100%" }}
          contentContainerStyle={{ paddingBottom: 150, paddingHorizontal: 16 }}
        >
          {/* Hero summary — whole card is tappable for its tooltip */}
          <InfoTip
            title="Total Assets"
            text="The combined balance of all your accounts, in your main currency. 'This Month' is your net change so far this month (income minus expenses)."
            style={styles.hero}
            layout="corner"
          >
            <Text style={styles.heroLabel}>Total Assets</Text>
            <Text
              style={[
                styles.heroValue,
                { color: totalAssets < 0 ? "#CD5D5D" : "#4EA758" },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
              {fmtAmount(totalAssets)}{sym}
            </Text>

            <View style={styles.heroStatsRow}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{accounts.length}</Text>
                <Text style={styles.heroStatLabel}>
                  {accounts.length === 1 ? "Account" : "Accounts"}
                </Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Text
                  style={[
                    styles.heroStatValue,
                    { color: monthNet >= 0 ? "#4EA758" : "#CD5D5D" },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.5}
                >
                  {monthNet >= 0 ? "+" : ""}{fmtAmount(monthNet)}{sym}
                </Text>
                <Text style={styles.heroStatLabel}>This Month</Text>
              </View>
            </View>
          </InfoTip>

          {/* List header — whole row tappable */}
          <InfoTip
            title="Your Accounts"
            text="Each card shows an account's current balance and its net change this month. Tap an account to open its full transaction history."
            style={styles.listHeader}
            layout="inline"
          >
            <Text style={styles.listHeaderText}>Your Accounts</Text>
          </InfoTip>

          {accounts.length === 0 ? (
            <Text style={{ color: "gray", textAlign: "center", marginTop: 20 }}>
              No accounts found.
            </Text>
          ) : (
            accounts.map((acc) => {
              const bal = parseFloat(acc.account_balance);
              const net = monthByAccount[acc.account_id] || 0;
              return (
                <TouchableOpacity
                  key={acc.account_id}
                  onPress={() => router.push(`/accounts/${acc.account_id}`)}
                  activeOpacity={0.75}
                  style={styles.accountCard}
                >
                  <View style={styles.accountTop}>
                    <View style={styles.accountLeft}>
                      <Text style={styles.accountEmoji}>{acc.account_emoji}</Text>
                      <Text style={styles.accountName} numberOfLines={1}>
                        {acc.account_name}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.accountBalance,
                        bal < 0 ? { color: "#CD5D5D" } : { color: "#4EA758" },
                      ]}
                      numberOfLines={1}
                    >
                      {fmtAmount(bal)}{sym}
                    </Text>
                  </View>

                  <View style={styles.accountBottom}>
                    {net === 0 ? (
                      <Text style={styles.accountSubMuted}>No activity this month</Text>
                    ) : (
                      <Text style={styles.accountSub}>
                        This month{"  "}
                        <Text style={{ color: net >= 0 ? "#4EA758" : "#CD5D5D", fontWeight: "700" }}>
                          {net >= 0 ? "+" : ""}{fmtAmount(net)}{sym}
                        </Text>
                      </Text>
                    )}
                    <Ionicons name="chevron-forward" size={16} color="#6b6d82" />
                  </View>
                </TouchableOpacity>
              );
            })
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

  // Hero
  hero: {
    backgroundColor: "#2C2E42",
    borderRadius: 16,
    padding: 18,
    marginTop: 4,
    marginBottom: 18,
  },
  heroLabel: { color: "#aaa", fontSize: 14 },
  heroValue: { fontSize: 34, fontWeight: "800", marginTop: 2 },
  heroStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#d9d9d915",
    paddingTop: 14,
  },
  heroStat: { flex: 1, alignItems: "center" },
  heroDivider: { width: 1, height: 34, backgroundColor: "#d9d9d915" },
  heroStatValue: { color: "#fff", fontSize: 18, fontWeight: "700" },
  heroStatLabel: { color: "#888", fontSize: 12, marginTop: 3 },

  // List header
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
    marginLeft: 2,
  },
  listHeaderText: { color: "#fff", fontSize: 17, fontWeight: "700" },

  // Account card
  accountCard: {
    backgroundColor: "#2C2E42",
    borderRadius: 14,
    padding: 15,
    marginBottom: 10,
  },
  accountTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  accountLeft: { flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8 },
  accountEmoji: { fontSize: 24, marginRight: 10 },
  accountName: { color: "white", fontSize: 16, fontWeight: "600", flex: 1 },
  accountBalance: { fontSize: 18, fontWeight: "bold" },

  accountBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  accountSub: { color: "#aaa", fontSize: 13 },
  accountSubMuted: { color: "#6b6d82", fontSize: 13 },
});
