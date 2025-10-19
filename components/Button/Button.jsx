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
    borderRadius: 2,
    borderColor: "#fff",
  },
  text: {
    fontSize: 20,
    color: "#fff",
  },
});
