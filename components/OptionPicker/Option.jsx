import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function Option(props) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => {
        props.valueUpdateFunction({
          emoji: props.emoji,
          name: props.name,
          id: props.id,
        });
      }}
    >
      <Text style={styles.optionText}>
        {props.emoji}
        {props.name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    borderColor: "#d9d9d925",
    borderWidth: 1,
    minWidth: "33.3%",
    height: 50,
  },
  optionText: {
    color: "white",
    textAlign: "center",
  },
});
