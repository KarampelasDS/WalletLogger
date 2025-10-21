import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function Button(props) {
  return (
    <TouchableOpacity
      onPress={props.enabled ? props.function : props.functionDisabled}
      style={[
        styles.container,
        {
          backgroundColor: props.enabled
            ? props.backgroundColor
            : props.disabledColor,
        },
      ]}
    >
      <Text style={styles.text}>{props.children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 80,
    borderWidth: 1,
    borderRadius: 14,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 2,
  },
  text: {
    fontSize: 20,
    color: "#fff",
    textAlign: "center",
  },
});
