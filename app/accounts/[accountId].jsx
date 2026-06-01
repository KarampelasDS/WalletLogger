import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { Store } from "../../stores/Store";
import Title from "../../components/Title/Title";
import TransactionDay from "../../components/TransactionRecords/TransactionDay";
import { fmtAmount } from "../../utils/format";
import { Ionicons } from "@expo/vector-icons";

const months = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

const fallback = (main, snapshot) =>
  main != null && main !== "" ? main : snapshot;

export default function AccountDetail() {
  const { accountId } = useLocalSearchParams();
  const navigation = useNavigation();
  const router = useRouter();

  const db = Store((state) => state.db);
  const dbInitialized = Store((state) => state.dbInitialized);
  const mainCurrency = Store((state) => state.mainCurrency);
  const setEditingID = Store((state) => state.setEditingID);
  const iconSize = Store((state) => state.iconSize);
  const currentDate = Store((state) => state.currentDate);

  const [account, setAccount] = useState(null);
  const [grouped, setGrouped] = useState({});
  const [monthlyIn, setMonthlyIn] = useState(0);
  const [monthlyOut, setMonthlyOut] = useState(0);
  const [loading, setLoading] = useState(false);
  const [shownMonth, setShownMonth] = useState(
    new Date(currentDate).getMonth()
  );
  const [shownYear, setShownYear] = useState(
    new Date(currentDate).getFullYear()
  );

  useEffect(() => {
    if (!dbInitialized || !db) return;
    fetchAccount();
  }, [dbInitialized]);

  // Re-fetch account balance when returning from editTransaction
  useFocusEffect(
    useCallback(() => {
      if (!dbInitialized || !db) return;
      fetchAccount();
      fetchTransactions();
    }, [dbInitialized, shownMonth, shownYear])
  );

  useEffect(() => {
    if (!dbInitialized || !db) return;
    fetchTransactions();
  }, [dbInitialized, shownMonth, shownYear]);

  const fetchAccount = async () => {
    try {
      const result = await db.getFirstAsync(
        "SELECT * FROM accounts WHERE account_id = ?",
        [accountId]
      );
      setAccount(result);
    } catch (e) {
      console.error("fetchAccount error:", e);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const month = String(shownMonth + 1).padStart(2, "0");
      const query = `
        SELECT
          t.transaction_id,
          t.transaction_type,
          t.transaction_amount,
          t.transaction_date,
          t.transaction_note,
          t.transaction_secondCurrencyAmount,
          t.account_from_id,
          t.account_to_id,
          af.account_name AS account_from_name,
          af.account_emoji AS account_from_emoji,
          at.account_name AS account_to_name,
          at.account_emoji AS account_to_emoji,
          a.account_name AS account_name,
          a.account_emoji AS account_emoji,
          t.account_from_snapshot_name,
          t.account_from_snapshot_emoji,
          t.account_to_snapshot_name,
          t.account_to_snapshot_emoji,
          t.account_snapshot_name,
          t.account_snapshot_emoji,
          c.category_name AS category_name,
          c.category_emoji AS category_emoji,
          t.category_name_snapshot,
          t.category_emoji_snapshot,
          cur.currency_symbol AS currency_symbol,
          t.currency_snapshot_name,
          t.currency_snapshot_symbol
        FROM transactions t
        LEFT JOIN accounts a ON t.account_id = a.account_id
        LEFT JOIN accounts af ON t.account_from_id = af.account_id
        LEFT JOIN accounts at ON t.account_to_id = at.account_id
        LEFT JOIN categories c ON t.category_id = c.category_id
        LEFT JOIN currencies cur ON t.currency_id = cur.currency_id
        WHERE (t.account_id = ? OR t.account_from_id = ? OR t.account_to_id = ?)
        AND strftime('%Y', t.transaction_date) = '${shownYear}'
        AND strftime('%m', t.transaction_date) = '${month}'
        ORDER BY t.transaction_date DESC
      `;
      const data = await db.getAllAsync(query, [accountId, accountId, accountId]);

      const grp = {};
      let totalIn = 0;
      let totalOut = 0;
      const id = parseInt(accountId);

      data.forEach((t) => {
        const onlyDate = t.transaction_date.slice(0, 10);
        if (!grp[onlyDate]) grp[onlyDate] = [];
        grp[onlyDate].push(t);

        if (t.transaction_type === "Income") {
          totalIn += parseFloat(
            t.transaction_secondCurrencyAmount || t.transaction_amount
          );
        } else if (t.transaction_type === "Expense") {
          totalOut += parseFloat(
            t.transaction_secondCurrencyAmount || t.transaction_amount
          );
        } else if (t.transaction_type === "Transfer") {
          if (t.account_to_id === id) {
            totalIn += parseFloat(t.transaction_amount);
          }
          if (t.account_from_id === id) {
            totalOut += parseFloat(t.transaction_amount);
          }
        }
      });

      setGrouped(grp);
      setMonthlyIn(totalIn);
      setMonthlyOut(totalOut);
    } catch (e) {
      console.error("fetchTransactions error:", e);
    } finally {
      setLoading(false);
    }
  };

  const sym = mainCurrency ? mainCurrency.currency_symbol : "";

  const goMonthBack = () => {
    if (shownMonth === 0) {
      setShownYear((y) => y - 1);
      setShownMonth(11);
    } else setShownMonth((m) => m - 1);
  };

  const goMonthForward = () => {
    if (shownMonth === 11) {
      setShownYear((y) => y + 1);
      setShownMonth(0);
    } else setShownMonth((m) => m + 1);
  };

  return (
    <View style={styles.container}>
      <Title
        title={account ? `${account.account_emoji} ${account.account_name}` : "Account"}
        backIcon="arrow-back-circle-outline"
        onPressBackIcon={() => navigation.goBack()}
      />

      {account && (
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text
            style={[
              styles.balanceValue,
              account.account_balance < 0
                ? { color: "#CD5D5D" }
                : { color: "#4EA758" },
            ]}
            numberOfLines={1}
          >
            {fmtAmount(account.account_balance)}{sym}
          </Text>
        </View>
      )}

      {/* Month navigation */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={goMonthBack}>
          <Ionicons name="chevron-back-outline" size={iconSize} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.monthNavText}>
          {months[shownMonth]} {shownYear}
        </Text>
        <TouchableOpacity onPress={goMonthForward}>
          <Ionicons name="chevron-forward-outline" size={iconSize} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Monthly In / Out */}
      <View style={styles.monthSummary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>In</Text>
          <Text style={[styles.summaryValue, { color: "#4EA758" }]} numberOfLines={1}>
            {fmtAmount(monthlyIn)}{sym}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Out</Text>
          <Text style={[styles.summaryValue, { color: "#CD5D5D" }]} numberOfLines={1}>
            {fmtAmount(monthlyOut)}{sym}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#734BE9" />
        </View>
      ) : (
        <ScrollView
          style={{ width: "100%" }}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {Object.keys(grouped).length === 0 && (
            <Text style={styles.emptyText}>No transactions this month</Text>
          )}
          {Object.keys(grouped).map((date) => {
            let dailyIncome = 0;
            let dailyExpenses = 0;
            grouped[date].forEach((t) => {
              const amt = parseFloat(
                t.transaction_secondCurrencyAmount != null
                  ? t.transaction_secondCurrencyAmount
                  : t.transaction_amount
              );
              if (t.transaction_type === "Income") dailyIncome += amt;
              else if (t.transaction_type === "Expense") dailyExpenses += amt;
            });
            return (
              <TransactionDay
                key={date}
                date={new Date(date).toLocaleDateString("en-GB", { day: "2-digit" })}
                weekday={new Date(date).toLocaleDateString("en-GB", { weekday: "short" })}
                month={new Date(date).toLocaleDateString("en-GB", { month: "2-digit" })}
                year={new Date(date).toLocaleDateString("en-GB", { year: "2-digit" })}
                income={dailyIncome}
                expenses={dailyExpenses}
              >
                {grouped[date].map((t) => (
                  <TouchableOpacity
                    key={t.transaction_id}
                    style={styles.txRow}
                    onPress={() => {
                      setEditingID(t.transaction_id);
                      router.push("/editTransaction");
                    }}
                  >
                    <View style={styles.txMain}>
                      {t.transaction_type === "Transfer" ? (
                        <>
                          <Text style={styles.txLeft} numberOfLines={1}>
                            {fallback(t.account_from_emoji, t.account_from_snapshot_emoji)}
                            {"  "}
                            {fallback(t.account_from_name, t.account_from_snapshot_name)}
                          </Text>
                          <Ionicons
                            name="arrow-forward-outline"
                            size={14}
                            color="#aaa"
                            style={{ marginHorizontal: 4 }}
                          />
                          <Text style={styles.txMid} numberOfLines={1}>
                            {fallback(t.account_to_emoji, t.account_to_snapshot_emoji)}
                            {"  "}
                            {fallback(t.account_to_name, t.account_to_snapshot_name)}
                          </Text>
                          <Text
                            style={[styles.txAmount, { color: "#734BE9" }]}
                            numberOfLines={1}
                          >
                            {fmtAmount(t.transaction_amount)}{" "}
                            {fallback(t.currency_symbol, t.currency_snapshot_symbol)}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text style={styles.txLeft} numberOfLines={1}>
                            {fallback(t.category_emoji, t.category_emoji_snapshot)}
                            {"  "}
                            {fallback(t.category_name, t.category_name_snapshot)}
                          </Text>
                          <Text style={styles.txMid} numberOfLines={1}>
                            {fallback(t.account_emoji, t.account_snapshot_emoji)}
                            {"  "}
                            {fallback(t.account_name, t.account_snapshot_name)}
                          </Text>
                          <Text
                            style={[
                              styles.txAmount,
                              {
                                color:
                                  t.transaction_type === "Income"
                                    ? "#4EA758"
                                    : "#CD5D5D",
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {fmtAmount(
                              t.transaction_secondCurrencyAmount != null
                                ? t.transaction_secondCurrencyAmount
                                : t.transaction_amount
                            )}{" "}
                            {fallback(t.currency_symbol, t.currency_snapshot_symbol)}
                          </Text>
                        </>
                      )}
                    </View>
                    {t.transaction_note ? (
                      <Text style={styles.txNote} numberOfLines={2}>
                        {t.transaction_note}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </TransactionDay>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1B25",
    alignItems: "center",
  },
  balanceRow: {
    width: "90%",
    backgroundColor: "#2C2E42",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  balanceLabel: {
    color: "#aaa",
    fontSize: 16,
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  monthNav: {
    width: "90%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  monthNavText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  monthSummary: {
    width: "90%",
    backgroundColor: "#2C2E42",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 10,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  summaryLabel: {
    color: "#aaa",
    fontSize: 12,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    width: "100%",
    textAlign: "center",
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#d9d9d930",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: {
    color: "#aaa",
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
  },
  txRow: {
    borderTopColor: "#d9d9d910",
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  txMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  txLeft: {
    flex: 2,
    color: "#fff",
    fontSize: 14,
  },
  txMid: {
    flex: 2,
    color: "#aaa",
    fontSize: 14,
    textAlign: "center",
  },
  txAmount: {
    flex: 2,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
  },
  txNote: {
    color: "#888",
    fontSize: 12,
    marginTop: 4,
    paddingLeft: 2,
  },
});
