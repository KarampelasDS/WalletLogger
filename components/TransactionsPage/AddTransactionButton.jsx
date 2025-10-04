import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Store } from "../../stores/Store";
import { useRouter } from "expo-router";

export default function AddTransactionButton() {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.AddTransactionButton}
      onPress={() => router.push("/addTransaction")}
    >
      <Ionicons
        name="add"
        size={Store((state) => state.iconSize) + 25}
        color="#fff"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  AddTransactionButton: {
    backgroundColor: "#2C2E42",
    padding: 20,
    position: "absolute",
    right: 0,
    bottom: 120,
    borderColor: "#fff",
    borderWidth: 2,
    borderRadius: 100,
    marginRight: "5%",
  },
});
