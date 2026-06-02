import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function Option(props) {
  return (
    <TouchableOpacity
      style={styles.cell}
      activeOpacity={0.7}
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
      <View style={styles.chip}>
        <Text style={styles.optionText} numberOfLines={1}>
          {props.emoji && `${props.emoji} `}
          {props.symbol && `${props.symbol} `}
          {props.name}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cell: {
    width: "33.33%",
  },
  chip: {
    backgroundColor: "#2C2E42",
    borderRadius: 6,
    margin: 5,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  optionText: {
    color: "white",
    textAlign: "center",
    fontSize: 14,
  },
});
