import { StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Store } from "../../stores/Store";
import { useRouter } from "expo-router";
import { COLORS } from "../../constants/theme";

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
    backgroundColor: COLORS.primary,
    padding: 20,
    position: "absolute",
    right: 0,
    bottom: 120,
    borderRadius: 100,
    marginRight: "5%",
    // boxShadow follows the circular shape (elevation would render a square)
    boxShadow: "0px 4px 10px rgba(0,0,0,0.35)",
  },
});
