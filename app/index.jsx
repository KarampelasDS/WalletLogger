import { StyleSheet, Text, View } from "react-native";
import NavBar from "../components/NavBar";
import AddTransactionButton from "../components/TransactionsPage/AddTransactionButton";

const Home = () => {
  return (
    <View style={styles.container}>
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
