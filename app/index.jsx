import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect } from "react";
import AddTransactionButton from "../components/TransactionsPage/AddTransactionButton";
import Title from "../components/Title/Title";
import { Ionicons } from "@expo/vector-icons";
import { Store } from "../stores/Store";
import TransactionDay from "../components/TransactionRecords/TransactionDay";

// Month names for display
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
  // Zustand state accessors
  const currentDate = Store((state) => state.currentDate);
  const db = Store((state) => state.db);
  const initDB = Store((state) => state.initDB);
  const dbInitialized = Store((state) => state.dbInitialized);
  const setDbInitialized = Store((state) => state.setDbInitialized);
  const mainCurrency = Store((state) => state.mainCurrency);

  const [grouped, setGrouped] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [shownMonth, setShownMonth] = useState(currentDate.getMonth());
  const [shownYear, setShownYear] = useState(currentDate.getFullYear());
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const iconSize = Store((state) => state.iconSize);
  const [loading, setLoading] = useState(false);

  // Initialize database once
  useEffect(() => {
    const init = async () => {
      if (!dbInitialized) {
        await initDB();
        setDbInitialized(true);
      }
    };
    init();
  }, []);

  // Fetch transactions whenever month/year or DB state changes
  useEffect(() => {
    if (!dbInitialized) return;
    const fetchTransactions = async () => {
      setLoading(true); // <-- start spinner
      try {
        const month = String(shownMonth + 1).padStart(2, "0");
        const query = `
          SELECT
            t.transaction_id,
            t.transaction_type,
            t.transaction_amount,
            t.transaction_date,
            t.transaction_note,
            af.account_name AS account_from_name,
            af.account_emoji AS account_from_emoji,
            at.account_name AS account_to_name,
            at.account_emoji AS account_to_emoji,
            a.account_name AS account_name,
            a.account_emoji AS account_emoji,
            c.category_name AS category_name,
            c.category_emoji AS category_emoji,
            cur.currency_symbol AS currency_symbol
          FROM transactions t
          LEFT JOIN accounts a ON t.account_id = a.account_id
          LEFT JOIN accounts af ON t.account_from_id = af.account_id
          LEFT JOIN accounts at ON t.account_to_id = at.account_id
          LEFT JOIN categories c ON t.category_id = c.category_id
          LEFT JOIN currencies cur ON t.currency_id = cur.currency_id
          WHERE strftime('%Y', t.transaction_date) = '${shownYear}'
          AND strftime('%m', t.transaction_date) = '${month}'
          ORDER BY t.transaction_date DESC
        `;
        const data = await db.getAllAsync(query);

        const grouped = {};
        data.forEach((t) => {
          const onlyDate = t.transaction_date.slice(0, 10);
          if (!grouped[onlyDate]) grouped[onlyDate] = [];
          grouped[onlyDate].push(t);
        });

        calculateMonthlyTotals(data);
        setGrouped(grouped);
        setTransactions(data);
      } catch (err) {
        console.error("DB read error:", err);
      } finally {
        setLoading(false); // <-- stop spinner
      }
    };
    fetchTransactions();
  }, [dbInitialized, shownMonth, shownYear]);

  const calculateMonthlyTotals = (data) => {
    let income = 0;
    let expenses = 0;
    if (!data || data.length === 0) {
      setMonthlyIncome(0);
      setMonthlyExpenses(0);
      return;
    }
    data.forEach((t) => {
      if (t.transaction_type === "Income")
        income += parseFloat(t.transaction_amount);
      else if (t.transaction_type === "Expense")
        expenses += parseFloat(t.transaction_amount);
      setMonthlyExpenses(expenses);
      setMonthlyIncome(income);
    });
  };

  return (
    <View style={styles.container}>
      <Title
        title={`${months[shownMonth]} ${shownYear}`}
        backIcon={"chevron-back-outline"}
        onPressBackIcon={() => {
          if (shownMonth === 0) {
            setShownYear((y) => y - 1);
            setShownMonth(11);
          } else setShownMonth((m) => m - 1);
        }}
        frontIcon={"chevron-forward-outline"}
        onPressFrontIcon={() => {
          if (shownMonth === 11) {
            setShownYear((y) => y + 1);
            setShownMonth(0);
          } else setShownMonth((m) => m + 1);
        }}
      />
      <View style={styles.monthSummary}>
        <View style={{ alignItems: "center", flexDirection: "row" }}>
          <Text style={[styles.monthSummaryText]}>Income: </Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
            style={[
              styles.monthSummaryValue,
              { color: "#4EA758", maxWidth: 100 },
            ]}
          >
            {Number(monthlyIncome).toLocaleString("en-US", {
              maximumFractionDigits: 2,
            })}
            {mainCurrency ? mainCurrency.symbol : ""}
          </Text>
        </View>
        <View style={{ alignItems: "center", flexDirection: "row" }}>
          <Text style={[styles.monthSummaryText]}>Expenses: </Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
            style={[
              styles.monthSummaryValue,
              { color: "#CD5D5D", maxWidth: 100 },
            ]}
          >
            {Number(monthlyExpenses).toLocaleString("en-US", {
              maximumFractionDigits: 2,
            })}
            {mainCurrency ? mainCurrency.symbol : ""}
          </Text>
        </View>
      </View>

      {loading ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            marginTop: 50,
          }}
        >
          <ActivityIndicator size="large" color="#734BE9" />
        </View>
      ) : (
        <ScrollView
          style={{ width: "100%" }}
          contentContainerStyle={{ paddingBottom: 200 }}
        >
          {Object.keys(grouped).map((date) => {
            let dailyIncome = 0;
            let dailyExpenses = 0;
            grouped[date].forEach((t) => {
              if (t.transaction_type === "Income")
                dailyIncome += parseFloat(t.transaction_amount);
              else if (t.transaction_type === "Expense")
                dailyExpenses += parseFloat(t.transaction_amount);
            });
            return (
              <TransactionDay
                date={new Date(date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                })}
                weekday={new Date(date).toLocaleDateString("en-GB", {
                  weekday: "short",
                })}
                month={new Date(date).toLocaleDateString("en-GB", {
                  month: "2-digit",
                })}
                year={new Date(date).toLocaleDateString("en-GB", {
                  year: "2-digit",
                })}
                key={date}
                income={dailyIncome}
                expenses={dailyExpenses}
                style={{
                  marginVertical: 10,
                  width: "100%",
                  paddingHorizontal: 20,
                  alignItems: "center",
                }}
              >
                {grouped[date].map((t) => (
                  <View
                    key={t.transaction_id}
                    style={{ borderTopColor: "#d9d9d905", borderTopWidth: 2 }}
                  >
                    <View
                      style={{
                        marginBottom: 8,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                        paddingHorizontal: 10,
                      }}
                    >
                      <Text
                        style={{
                          color: "white",
                          width:
                            t.transaction_type == "Transfer" ? "auto" : "30%",
                        }}
                        numberOfLines={1}
                      >
                        {t.transaction_type == "Transfer"
                          ? `${t.account_from_emoji}  ${t.account_from_name}`
                          : `${t.category_emoji}  ${t.category_name}`}
                      </Text>
                      {t.transaction_type == "Transfer" && (
                        <Text
                          style={{
                            color: "white",
                            width: "10%",
                            textAlign: "center",
                          }}
                        >
                          <Ionicons
                            name="arrow-forward-outline"
                            size={iconSize - 10}
                            color="#fff"
                          />
                        </Text>
                      )}
                      <Text
                        style={{
                          color: "white",
                          width: "20%",
                          textAlign: "center",
                        }}
                        numberOfLines={1}
                      >
                        {t.transaction_type == "Transfer"
                          ? `${t.account_to_emoji}  ${t.account_to_name}`
                          : `${t.account_emoji}  ${t.account_name}`}
                      </Text>
                      {t.transaction_type == "Transfer" && (
                        <View style={{ width: "60%" }}>
                          <Text
                            style={{ color: "#734BE9", textAlign: "center" }}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.5}
                          >
                            {`${Number(t.transaction_amount).toLocaleString(
                              "en-US",
                              { maximumFractionDigits: 2 }
                            )} ${t.currency_symbol}`}
                          </Text>
                        </View>
                      )}
                      <View style={{ width: "25%" }}>
                        {t.transaction_type == "Income" && (
                          <Text
                            style={{ color: "#4EA758", textAlign: "center" }}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.5}
                          >
                            {Number(t.transaction_amount).toLocaleString(
                              "en-US",
                              { maximumFractionDigits: 2 }
                            )}{" "}
                            {t.currency_symbol}
                          </Text>
                        )}
                      </View>
                      <View style={{ width: "15%" }}>
                        {t.transaction_type == "Expense" && (
                          <Text
                            style={{ color: "#CD5D5D", textAlign: "center" }}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.5}
                          >
                            {Number(t.transaction_amount).toLocaleString(
                              "en-US",
                              { maximumFractionDigits: 2 }
                            )}{" "}
                            {t.currency_symbol}
                          </Text>
                        )}
                      </View>
                    </View>
                    {t.transaction_note && (
                      <View>
                        <Text
                          style={{
                            color: "white",
                            paddingHorizontal: 20,
                            paddingVertical: 10,
                          }}
                        >
                          {t.transaction_note}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </TransactionDay>
            );
          })}
        </ScrollView>
      )}

      <AddTransactionButton />
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1E1E24",
    alignItems: "center",
  },
  monthSummary: {
    alignItems: "center",
    flexDirection: "row",
    width: "90%",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  monthSummaryText: {
    color: "white",
    fontSize: 20,
  },
  monthSummaryValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
});
