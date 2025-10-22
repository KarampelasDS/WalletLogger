import { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import { Store } from "../../stores/Store";
import { Ionicons } from "@expo/vector-icons";
import Button from "../../components/Button/Button";
import { useRouter } from "expo-router";

export default function SetupScreen1() {
  const router = useRouter();
  const setShowNavbar = Store((state) => state.setShowNavbar);
  const iconSize = Store((state) => state.iconSize);
  setShowNavbar(false);

  const mainCurrency = Store((state) => state.mainCurrency);
  const setupIncomeCategories = Store((state) => state.setupIncomeCategories);
  const setupExpenseCategories = Store((state) => state.setupExpenseCategories);
  const setupAccounts = Store((state) => state.setupAccounts);
  const db = Store((state) => state.db);

  useEffect(() => {
    console.log("Main Currency:", mainCurrency);
    console.log("Income Categories:", setupIncomeCategories);
    console.log("Expense Categories:", setupExpenseCategories);
    console.log("Accounts:", setupAccounts);
  }, []);

  useEffect(() => {
    const handler = () => true;
    BackHandler.addEventListener("hardwareBackPress", handler);
    return () => BackHandler.removeEventListener("hardwareBackPress", handler);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.introText}>Initializing...</Text>
      <ActivityIndicator size="large" color="#fff" style={{ marginTop: 32 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", flex: 1 },
  intro: {
    backgroundColor: "#2C2E42",
    padding: 20,
    borderRadius: 20,
  },
  introText: {
    color: "#fff",
    fontSize: 30,
    textAlign: "center",
  },
  introSubText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
  buttons: {
    position: "absolute",
    bottom: 0,
    marginBottom: 50,
    width: "80%",
  },
});
