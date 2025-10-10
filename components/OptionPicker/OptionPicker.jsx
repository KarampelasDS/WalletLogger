import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import KeyboardHeader from "../KeyboardHeader/KeyboardHeader";

export default function OptionPicker(props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.exitView} onPress={props.closePicker} />
      <View style={styles.picker}>
        <KeyboardHeader
          text={props.headerText}
          backgroundColor={props.headerBackgroundColor}
        />
        {props.options.map((category) => (
          <Text key={category.category_id}>
            {category.category_emoji}
            {category.category_name}
          </Text>
        ))}
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
  },
  picker: {
    zIndex: 1002,
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
