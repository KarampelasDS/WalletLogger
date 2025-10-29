import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function Option(props) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => {
        props.valueUpdateFunction({
          emoji: props.emoji ? props.emoji : undefined,
          name: props.name ? props.name : undefined,
          id: props.id ? props.id : undefined,
          symbol: props.symbol ? props.symbol : undefined,
          conversion_rate_to_main: props.conversion_rate_to_main
            ? props.conversion_rate_to_main
            : undefined,
        });
      }}
    >
      <Text style={styles.optionText}>
        {props.emoji && `${props.emoji} `}
        {props.symbol && `${props.symbol} `}
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
    maxWidth: "33.3%",
  },
  optionText: {
    color: "white",
    textAlign: "center",
  },
});
