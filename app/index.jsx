import { StyleSheet, Text, View } from "react-native";
import { useState, useEffect, use } from "react";
import AddTransactionButton from "../components/TransactionsPage/AddTransactionButton";
import Title from "../components/Title/Title";
import { Store } from "../stores/Store";
import { useRouter } from "expo-router";
import { Redirect } from "expo-router";
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
  const completedSetup = Store((state) => state.completedSetup);
  const initDB = Store((state) => state.initDB);
  const db = Store((state) => state.db);
  const router = useRouter();

  useEffect(() => {
    initDB();
  }, []);

  if (!completedSetup) {
    return <Redirect href="/setup/setup1" />;
  }

  useEffect(() => {
    const readDB = async () => {
      const accounts = await db.getAllAsync("SELECT * FROM accounts");
      console.log("Accounts:", accounts);
      const categories = await db.getAllAsync("SELECT * FROM categories");
      console.log("Categories:", categories);
      const currencies = await db.getAllAsync("SELECT * FROM currencies");
      console.log("Currencies:", currencies);
    };
    readDB();
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
    backgroundColor: "#1E1E24",
    alignItems: "center",
  },
  title: {
    fontWeight: "bold",
    fontSize: 18,
    color: "white",
  },
});
