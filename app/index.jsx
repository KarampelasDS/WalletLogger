import { StyleSheet, Text, View } from "react-native";
import { useState, useEffect } from "react";
import AddTransactionButton from "../components/TransactionsPage/AddTransactionButton";
import Title from "../components/Title/Title";
import { Store } from "../stores/Store";
import { Redirect } from "expo-router";
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
  const completedSetup = Store((state) => state.completedSetup);

  const [grouped, setGrouped] = useState([]);

  // Local component state
  const [shownMonth, setShownMonth] = useState(currentDate.getMonth()); // month currently displayed
  const [shownYear, setShownYear] = useState(currentDate.getFullYear()); // year currently displayed
  const [transactions, setTransactions] = useState([]); // fetched transactions for that month

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

  useEffect(() => {
    console.log(grouped);
  }, [grouped]);

  // Fetch transactions whenever month/year or DB state changes
  useEffect(() => {
    if (!dbInitialized) return; // skip until DB is ready
    const fetchTransactions = async () => {
      try {
        // Format month as two digits (e.g., "01" for January)
        const month = String(shownMonth + 1).padStart(2, "0");

        // Query only the transactions from that month/year
        const query = `
  SELECT
    t.transaction_id,
    t.transaction_type,
    t.transaction_amount,
    t.transaction_date,
    t.transaction_note,
    a.account_name AS account_name,
    a.account_emoji AS account_emoji,
    c.category_name AS category_name,
    c.category_emoji AS category_emoji,
    cur.currency_symbol AS currency_symbol
  FROM transactions t
  LEFT JOIN accounts a ON t.account_id = a.account_id
  LEFT JOIN categories c ON t.category_id = c.category_id
  LEFT JOIN currencies cur ON t.currency_id = cur.currency_id
  WHERE strftime('%Y', t.transaction_date) = '${shownYear}'
  AND strftime('%m', t.transaction_date) = '${month}'
  ORDER BY t.transaction_date DESC
`;

        // Execute query and update state
        const data = await db.getAllAsync(query);
        const grouped = {};
        const groupByDay = () => {
          for (let i = 0; i < data.length; i++) {
            const onlyDate = data[i].transaction_date.slice(0, 10);

            if (!grouped[onlyDate]) {
              grouped[onlyDate] = []; // create array for this date
            }

            grouped[onlyDate].push(data[i]); // push transaction into array
          }
        };

        groupByDay();

        setGrouped(grouped);

        setTransactions(data);
      } catch (err) {
        console.error("DB read error:", err);
      }
    };

    fetchTransactions();
  }, [dbInitialized, shownMonth, shownYear]); // re-run when month/year/db changes

  // Redirect to setup if user hasn’t finished initial app setup
  if (!completedSetup) return <Redirect href="/setup/setup1" />;

  // UI rendering
  return (
    <View style={styles.container}>
      {/* Month navigation header */}
      <Title
        title={`${months[shownMonth]} ${shownYear}`}
        backIcon={"chevron-back-outline"}
        onPressBackIcon={() => {
          // Move one month back; adjust year if crossing January
          if (shownMonth === 0) {
            setShownYear((y) => y - 1);
            setShownMonth(11);
          } else {
            setShownMonth((m) => m - 1);
          }
        }}
        frontIcon={"chevron-forward-outline"}
        onPressFrontIcon={() => {
          // Move one month forward; adjust year if crossing December
          if (shownMonth === 11) {
            setShownYear((y) => y + 1);
            setShownMonth(0);
          } else {
            setShownMonth((m) => m + 1);
          }
        }}
      />
      {/* Transactions list */}
      {Object.keys(grouped).map((date) => (
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
                    width: "30%",
                  }}
                  numberOfLines={1}
                >
                  {t.category_emoji} {t.category_name}
                </Text>

                <Text
                  style={{
                    color: "white",
                    width: "20%",
                    textAlign: "center",
                  }}
                  numberOfLines={1}
                >
                  {t.account_emoji} {t.account_name}
                </Text>

                <View
                  style={{
                    width: "25%",
                  }}
                >
                  {t.transaction_type == "Income" && (
                    <Text
                      style={{
                        color: "#4EA758",
                        textAlign: "center",
                      }}
                    >
                      {t.transaction_amount} {t.currency_symbol}
                    </Text>
                  )}
                </View>
                <View
                  style={{
                    width: "15%",
                  }}
                >
                  {t.transaction_type == "Expense" && (
                    <Text
                      style={{
                        color: "#CD5D5D",
                        textAlign: "center",
                      }}
                    >
                      {t.transaction_amount} {t.currency_symbol}
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
      ))}

      {/* Floating add button */}
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
});
