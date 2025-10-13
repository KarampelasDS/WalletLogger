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
  const dbInitialized = Store((state) => state.dbInitialized);
  const setDbInitialized = Store((state) => state.setDbInitialized);
  const [isFetching, setIsFetching] = useState(false);
  const dbUpToDate = Store((state) => state.dbUpToDate);
  const setDbUpToDate = Store((state) => state.setDbUpToDate);
  const fetchedTransactions = Store((state) => state.fetchedTransactions);
  const setfetchedTransactions = Store((state) => state.setfetchedTransactions);

  //debugging
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!dbInitialized) {
      initDB();
      setDbInitialized(true);
    }
  }, []);

  if (!completedSetup) {
    return <Redirect href="/setup/setup1" />;
  }

  useEffect(() => {
    const readDB = async () => {
      if (isFetching) return;
      if (!dbUpToDate) {
        setIsFetching(true);
        try {
          /*const accountsData = await db.getAllAsync("SELECT * FROM accounts");
        setAccounts(accountsData);

        const categoriesData = await db.getAllAsync("SELECT * FROM categories");
        setCategories(categoriesData);

        const currenciesData = await db.getAllAsync("SELECT * FROM currencies");
        setCurrencies(currenciesData);*/

          const transactionsData = await db.getAllAsync(
            "SELECT * FROM transactions"
          );
          setfetchedTransactions(transactionsData);
        } catch (e) {
          console.log("DB error:", e);
        }
        setIsFetching(false);
        setDbUpToDate(true);
      }
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
      <Text>{dbInitialized ? "True" : "False"}</Text>
      <View>
        {fetchedTransactions.map((transaction) => (
          <View key={transaction.transaction_id}>
            <Text>Transaction ID:{transaction.transaction_id}</Text>
            <Text>Date:{transaction.transaction_date}</Text>
            <Text>Amount:{transaction.transaction_amount}</Text>
            <Text>Currency ID:{transaction.currency_id}</Text>
            <Text>Category ID:{transaction.category_id}</Text>
            <Text>Account ID:{transaction.account_id}</Text>
          </View>
        ))}
      </View>
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
