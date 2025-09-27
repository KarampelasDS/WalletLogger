import { StyleSheet, Text, View } from "react-native";
import NavBar from "../components/NavBar";

const Home = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Statistics Page</Text>
      <Text style={{ marginTop: 10, marginBottom: 30 }}>Statistics here</Text>
    </View>
  );
};
export default Home;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontWeight: "bold",
    fontSize: 18,
  },
});
