import { StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import NavBar from "../components/NavBar";
import AddTransactionButton from "../components/TransactionsPage/AddTransactionButton";
import Title from "../components/Title/Title";
import { Store } from "../stores/Store";

const Home = () => {
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
  const currentMonth = Store((state) => state.currentDate.getMonth());
  const currentYear = Store((state) => state.currentDate.getFullYear());
  const [shownMonth, setShownMonth] = useState(currentMonth);
  const [shownYear, setShownYear] = useState(currentYear);

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
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E1E24",
  },
  title: {
    fontWeight: "bold",
    fontSize: 18,
    color: "white",
  },
});
