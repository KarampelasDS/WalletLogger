import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Title from "../components/Title/Title";
import { Ionicons } from "@expo/vector-icons";
import { Store } from "../stores/Store";
import { useRouter } from "expo-router";

export default function Settings() {
  const router = useRouter();
  const iconSize = Store((state) => state.iconSize);

  const settingsOptions = [
    {
      name: "Accounts",
      icon: "wallet-outline",
      route: "/settings/manageAccounts",
    },
    {
      name: "Income Categories",
      icon: "list-outline",
      route: "/settings/manageIncomeCategories",
    },
    {
      name: "Expense Categories",
      icon: "list-outline",
      route: "/settings/manageExpenseCategories",
    },
    {
      name: "Currencies",
      icon: "cash-outline",
      route: "/settings/manageCurrencies",
    },
  ];

  return (
    <View style={styles.container}>
      <Title title="Settings" />

      <ScrollView
        style={{ width: "100%" }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
      >
        {settingsOptions.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.option}
            activeOpacity={0.7}
            onPress={() => router.push(item.route)}
          >
            <View style={styles.optionLeft}>
              <Ionicons name={item.icon} size={iconSize} color="#fff" />
              <Text style={styles.optionText}>{item.name}</Text>
            </View>
            <Ionicons
              name="chevron-forward-outline"
              size={iconSize - 5}
              color="#aaa"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1B25",
    alignItems: "center",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#2C2E42",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  optionText: {
    color: "white",
    fontSize: 18,
    fontWeight: "500",
  },
});
