import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Store } from "../../stores/Store";
import { useState } from "react";
import KeyboardHeader from "../KeyboardHeader/KeyboardHeader";
import OptionPicker from "../OptionPicker/OptionPicker";

const { height: screenHeight } = Dimensions.get("window");
const minHeight = 0.38 * screenHeight;

export default function Keyboard(props) {
  const iconSize = Store((state) => state.iconSize);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const updateValue = (val) => {
    let str = props.value.toString();
    if (val === "." && str.includes(".")) return;
    let nextStr = str === "0" && val !== "." ? val : str + val;
    if (nextStr.includes(".") && nextStr.split(".")[1].length > 2) return;
    if (nextStr.length > 14 && val != ".") return;
    props.valueUpdateFunction(nextStr);
  };

  const backspace = () =>
    props.valueUpdateFunction((prev) => prev.slice(0, -1));
  const clearAll = () => props.valueUpdateFunction("");

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
            {[
              ["1", "2", "3", "backspace"],
              ["4", "5", "6", "cash"],
              ["7", "8", "9", "calc"],
              ["trash", "0", ".", "done"],
            ].map((row, idx) => (
              <View key={idx} style={styles.keyboardRow}>
                {row.map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.keyboardButton}
                    onPress={() => {
                      if (key === "backspace") backspace();
                      else if (key === "cash") setShowCurrencyPicker(true);
                      else if (key === "trash") clearAll();
                      else if (key === "done") props.closeKeyboard();
                      else updateValue(key);
                    }}
                  >
                    {key.match(/[0-9.]/) ? (
                      <Text style={styles.keyboardButtonText}>{key}</Text>
                    ) : (
                      <Ionicons
                        name={
                          key === "cash"
                            ? "cash"
                            : key === "trash"
                            ? "trash"
                            : key === "calc"
                            ? "calculator"
                            : "backspace"
                        }
                        size={iconSize}
                        color="#fff"
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
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
