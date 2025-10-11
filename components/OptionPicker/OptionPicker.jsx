import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import KeyboardHeader from "../KeyboardHeader/KeyboardHeader";
import Option from "./Option";

export default function OptionPicker(props) {
  // Determine the word to use based on props.type
  const word = props.type === "Account" ? "account" : "category";

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.exitView} onPress={props.closePicker} />
      <View style={styles.picker}>
        <KeyboardHeader
          text={props.headerText}
          backgroundColor={props.headerBackgroundColor}
        />
        <View style={styles.options}>
          {props.options.map((option) => (
            <Option
              key={option[`${word}_id`]}
              emoji={option[`${word}_emoji`]}
              name={option[`${word}_name`]}
              id={option[`${word}_id`]}
              valueUpdateFunction={props.valueUpdateFunction}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#363642",
    height: "41%",
  },
  picker: {
    zIndex: 1002,
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  exitView: {
    position: "absolute",
    bottom: 0,
    flex: 1,
    height: 2000,
    width: "100%",
    zIndex: 1001,
  },
});
