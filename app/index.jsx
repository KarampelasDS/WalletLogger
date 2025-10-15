import { StyleSheet, Text, View } from "react-native";
import { useState, useEffect } from "react";
import AddTransactionButton from "../components/TransactionsPage/AddTransactionButton";
import Title from "../components/Title/Title";
import { Store } from "../stores/Store";
import { Redirect } from "expo-router";

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
          SELECT * FROM transactions
          WHERE strftime('%Y', transaction_date) = '${shownYear}'
          AND strftime('%m', transaction_date) = '${month}'
          ORDER BY transaction_date DESC
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
        <View
          key={date}
          style={{
            marginVertical: 10,
            width: "100%",
            paddingHorizontal: 20,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "white",
              fontWeight: "bold",
              fontSize: 18,
              marginBottom: 5,
            }}
          >
            {new Date(date).toLocaleDateString("en-GB", {
              weekday: "short",
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </Text>
          {grouped[date].map((t) => (
            <View key={t.transaction_id} style={{ marginBottom: 8 }}>
              <Text style={{ color: "white" }}>ID: {t.transaction_id}</Text>
              <Text style={{ color: "white" }}>
                Time:{" "}
                {new Date(t.transaction_date).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </Text>
              <Text style={{ color: "white" }}>
                Amount: {t.transaction_amount}
              </Text>
              <Text style={{ color: "white" }}>
                ------------------------------
              </Text>
            </View>
          ))}
        </View>
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
