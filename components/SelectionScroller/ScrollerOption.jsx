import { StyleSheet, TouchableOpacity, Text } from "react-native";

export default function ScrollerOption(props) {
  return (
    <TouchableOpacity
      onPress={props.function}
      style={[
        styles.option,
        props.active ? { backgroundColor: "#4CAF50" } : null,
      ]}
    >
      <Text style={[styles.optionText]}>{props.children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  option: {
    backgroundColor: "#363642",
    width: "80%",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    marginBottom: 10,
    borderRadius: 10,
  },
  optionText: {
    color: "#fff",
    fontSize: 20,
  },
});
