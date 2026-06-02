import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function EmptyState({ text, icon = "receipt-outline" }) {
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={46} color="#3d3e4f" />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 70,
    paddingHorizontal: 24,
    gap: 12,
  },
  text: {
    color: "#8E8FA3",
    fontSize: 15,
    textAlign: "center",
  },
});
