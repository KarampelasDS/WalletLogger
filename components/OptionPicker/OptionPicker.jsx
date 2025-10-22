import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import KeyboardHeader from "../KeyboardHeader/KeyboardHeader";
import Option from "./Option";

const { height: screenHeight } = Dimensions.get("window");
const pickerHeight = Math.round(screenHeight * 0.41);

export default function OptionPicker(props) {
  const word =
    props.type === "Account"
      ? "account"
      : props.type === "Currencies"
      ? "currency"
      : "category";

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.exitView}
        onPress={props.closePicker}
        activeOpacity={1}
      />
      <View style={styles.container}>
        {props.headerText && (
          <KeyboardHeader
            text={props.headerText}
            backgroundColor={props.headerBackgroundColor}
          />
        )}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.options}
          showsVerticalScrollIndicator={true}
        >
          {props.options?.map((option) => (
            <Option
              key={option[`${word}_id`]}
              emoji={option[`${word}_emoji`]}
              name={option[`${word}_name`]}
              id={option[`${word}_id`]}
              symbol={option[`${word}_symbol`]}
              valueUpdateFunction={props.valueUpdateFunction}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  exitView: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: pickerHeight,
    backgroundColor: "transparent",
    zIndex: 1001,
  },
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: pickerHeight,
    backgroundColor: "#363642",
    zIndex: 1002,
    overflow: "hidden",
  },
  scrollArea: {
    flex: 1,
    width: "100%",
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
});
