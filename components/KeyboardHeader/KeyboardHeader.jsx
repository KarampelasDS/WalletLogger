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
    fontSize: 20,
    padding: 12,
    textAlign: "center",
    borderTopColor: "#fff",
    borderTopWidth: 2,
    borderBottomColor: "#fff",
    borderBottomWidth: 2,
  },
});
