import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Store } from "../../stores/Store";
import { useEffect, useState } from "react";
import KeyboardHeader from "../KeyboardHeader/KeyboardHeader";
import OptionPicker from "../OptionPicker/OptionPicker";
import Toast from "react-native-toast-message";

const { height: screenHeight } = Dimensions.get("window");
const minHeight = 0.38 * screenHeight;

export default function Keyboard(props) {
  const iconSize = Store((state) => state.iconSize);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  useEffect(() => {
    props.value.toLocaleString("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
    });
  }, [props.value]);

  const updateValue = (val) => {
    let str = props.value.toString();

    // Prevent multiple decimals
    if (val === "." && str.includes(".")) return;

    // Preview the new value as a string
    let nextStr = str === "0" && val !== "." ? val : str + val;

    // Check for >2 decimals
    if (nextStr.includes(".") && nextStr.split(".")[1].length > 2) {
      nextStr = nextStr.slice(0, -2) + val;
      props.valueUpdateFunction(nextStr);
      return;
    }

    // Manage Extreme Amount Lengths
    if (nextStr.length > 14 && val !== ".") {
      if (nextStr.includes(".") && nextStr.length <= 17) {
        props.valueUpdateFunction(nextStr);
        return;
      }
      return;
    }

    props.valueUpdateFunction(nextStr);
  };

  const backspaceValue = () => {
    props.valueUpdateFunction((prev) => prev.slice(0, -1));
  };

  const trashValue = () => {
    props.valueUpdateFunction("");
  };

  const Done = () => {
    props.closeKeyboard();
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={[
          styles.exitView,
          showCurrencyPicker && { bottom: minHeight + 85 },
        ]}
        onPress={() => {
          if (showCurrencyPicker) setShowCurrencyPicker(false);
          else props.closeKeyboard();
        }}
        activeOpacity={1}
      />
      {!showCurrencyPicker && (
        <View style={styles.container}>
          <KeyboardHeader
            text={props.headerText}
            backgroundColor={props.headerBackgroundColor}
          />
          <View>
            {/* Row 1 */}
            <View style={styles.keyboardRow}>
              <TouchableOpacity
                style={styles.keyboardButton}
                onPress={() => updateValue("1")}
              >
                <Text style={styles.keyboardButtonText}>1</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.keyboardButton}
                onPress={() => updateValue("2")}
              >
                <Text style={styles.keyboardButtonText}>2</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.keyboardButton}
                onPress={() => updateValue("3")}
              >
                <Text style={styles.keyboardButtonText}>3</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.keyboardButton}
                onPress={backspaceValue}
              >
                <Ionicons name="backspace" size={iconSize} color="#fff" />
              </TouchableOpacity>
            </View>
            {/* Row 2 */}
            <View style={styles.keyboardRow}>
              <TouchableOpacity
                style={styles.keyboardButton}
                onPress={() => updateValue("4")}
              >
                <Text style={styles.keyboardButtonText}>4</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.keyboardButton}
                onPress={() => updateValue("5")}
              >
                <Text style={styles.keyboardButtonText}>5</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.keyboardButton}
                onPress={() => updateValue("6")}
              >
                <Text style={styles.keyboardButtonText}>6</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.keyboardButton}
                onPress={() =>
                  props.allowExchange
                    ? setShowCurrencyPicker(true)
                    : Toast.show({
                        type: "error",
                        text1: "Error",
                        text2:
                          "Cannot change currency on transfer transactions",
                      })
                }
              >
                <Ionicons name="cash" size={iconSize} color="#fff" />
              </TouchableOpacity>
            </View>
            {/* Row 3 */}
            <View style={styles.keyboardRow}>
              <TouchableOpacity
                style={styles.keyboardButton}
                onPress={() => updateValue("7")}
              >
                <Text style={styles.keyboardButtonText}>7</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.keyboardButton}
                onPress={() => updateValue("8")}
              >
                <Text style={styles.keyboardButtonText}>8</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.keyboardButton}
                onPress={() => updateValue("9")}
              >
                <Text style={styles.keyboardButtonText}>9</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.keyboardButton}>
                <Ionicons name="calculator" size={iconSize} color="#fff" />
              </TouchableOpacity>
            </View>
            {/* Row 4 */}
            <View style={styles.keyboardRow}>
              <TouchableOpacity
                style={styles.keyboardButton}
                onPress={trashValue}
              >
                <Ionicons name="trash" size={iconSize} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.keyboardButton}
                onPress={() => updateValue("0")}
              >
                <Text style={styles.keyboardButtonText}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.keyboardButton}
                onPress={() => updateValue(".")}
              >
                <Text style={styles.keyboardButtonText}>.</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.keyboardButton,
                  { backgroundColor: props.typeColor },
                ]}
                onPress={Done}
              >
                <Text style={[styles.keyboardButtonText, { fontSize: 18 }]}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      {showCurrencyPicker && (
        <View style={[styles.currencyPicker, { minHeight: minHeight + 85 }]}>
          <KeyboardHeader
            text={props.headerText}
            backgroundColor={props.headerBackgroundColor}
          />
          <OptionPicker
            valueUpdateFunction={props.updateCurrency}
            options={props.currencies}
            closePicker={() => setShowCurrencyPicker(false)}
            type="Currencies"
          />
        </View>
      )}
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
    bottom: minHeight,
    backgroundColor: "transparent",
    zIndex: 1001,
  },
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: minHeight,
    backgroundColor: "#363642",
    zIndex: 1002,
    overflow: "hidden",
    paddingBottom: 6,
  },
  keyboardRow: {
    flexDirection: "row",
    backgroundColor: "#363642",
  },
  keyboardButton: {
    padding: 20,
    minWidth: "25%",
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#d9d9d925",
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  keyboardButtonText: {
    color: "#fff",
    fontSize: 24,
  },
  currencyPicker: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#363642",
    zIndex: 1002,
    overflow: "hidden",
  },
});
