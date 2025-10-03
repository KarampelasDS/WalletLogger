import { StyleSheet, Text, View } from "react-native";
import NavBar from "../components/NavBar";
import Title from "../components/Title/Title";

const Home = () => {
  return (
    <View style={styles.container}>
      <Title title="Add Transaction" />
      <Text style={styles.title}>Add Transaction Page</Text>
      <Text style={{ marginTop: 10, marginBottom: 30, color: "white" }}>
        Add transactions here
      </Text>
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
