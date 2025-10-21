import { StyleSheet, TouchableOpacity, Text } from "react-native";

export default function ScrollerOption(props) {
  return (
    <TouchableOpacity
      onPress={props.function}
      style={[
        styles.option,
        props.active ? { backgroundColor: "#3193c0ff" } : null,
      ]}
    >
      <Text style={[styles.optionText]}>{props.children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  option: {
    backgroundColor: "#2C2E42",
    width: "80%",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 2,
  },
  optionText: {
    color: "#fff",
    fontSize: 20,
  },
});
