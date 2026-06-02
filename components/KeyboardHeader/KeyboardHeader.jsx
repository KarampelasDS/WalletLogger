import { View, Text, StyleSheet } from "react-native";

export default function KeyboardHeader(props) {
  return (
    <View
      style={[
        styles.headerContainer,
        { backgroundColor: props.backgroundColor },
      ]}
    >
      <Text style={styles.KeyboardHeaderText}>{props.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  KeyboardHeaderText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    paddingVertical: 12,
    textAlign: "center",
  },
});
