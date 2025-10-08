import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Store } from "../../stores/Store";
import { useEffect } from "react";
import KeyboardHeader from "../KeyboardHeader/KeyboardHeader";

export default function Keyboard(props) {
  const iconSize = Store((state) => state.iconSize);

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
    <View style={styles.container}>
      <TouchableOpacity
        onPress={props.closeKeyboard}
        style={styles.exitView}
      ></TouchableOpacity>
      <View style={styles.keyboard}>
        <View>
          <KeyboardHeader
            text={props.headerText}
            backgroundColor={props.headerBackgroundColor}
          />
        </View>
        <View>
          <View style={styles.keyboardRow}>
            <TouchableOpacity
              style={[styles.keyboardButton, {}]}
              onPress={() => updateValue("1")}
            >
              <Text style={styles.keyboardButtonText}>1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.keyboardButton, {}]}
              onPress={() => updateValue("2")}
            >
              <Text style={styles.keyboardButtonText}>2</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.keyboardButton, {}]}
              onPress={() => updateValue("3")}
            >
              <Text style={styles.keyboardButtonText}>3</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.keyboardButton, {}]}
              onPress={backspaceValue}
            >
              <Ionicons name="backspace" size={iconSize} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.keyboardRow}>
            <TouchableOpacity
              style={[styles.keyboardButton, {}]}
              onPress={() => updateValue("4")}
            >
              <Text style={styles.keyboardButtonText}>4</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.keyboardButton, {}]}
              onPress={() => updateValue("5")}
            >
              <Text style={styles.keyboardButtonText}>5</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.keyboardButton, {}]}
              onPress={() => updateValue("6")}
            >
              <Text style={styles.keyboardButtonText}>6</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.keyboardButton, {}]}>
              <Ionicons name="cash" size={iconSize} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.keyboardRow}>
            <TouchableOpacity
              style={[styles.keyboardButton, {}]}
              onPress={() => updateValue("7")}
            >
              <Text style={styles.keyboardButtonText}>7</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.keyboardButton, {}]}
              onPress={() => updateValue("8")}
            >
              <Text style={styles.keyboardButtonText}>8</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.keyboardButton, {}]}
              onPress={() => updateValue("9")}
            >
              <Text style={styles.keyboardButtonText}>9</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.keyboardButton, {}]}>
              <Ionicons name="calculator" size={iconSize} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.keyboardRow}>
            <TouchableOpacity
              style={[styles.keyboardButton, {}]}
              onPress={trashValue}
            >
              <Ionicons name="trash" size={iconSize} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.keyboardButton, {}]}
              onPress={() => updateValue("0")}
            >
              <Text style={styles.keyboardButtonText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.keyboardButton, {}]}
              onPress={() => updateValue(".")}
            >
              <Text style={styles.keyboardButtonText}>.</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.keyboardButton, {}]}
              onPress={Done}
            >
              <Text style={[styles.keyboardButtonText, { fontSize: 18 }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
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
  },
  keyboardHeader: {
    color: "white",
    fontSize: 20,
    padding: 12,
    textAlign: "center",
    borderTopColor: "#fff",
    borderTopWidth: 2,
    borderBottomColor: "#fff",
    borderBottomWidth: 2,
  },
  keyboardRow: {
    flexDirection: "row",
  },
  keyboardButton: {
    padding: 20,
    minWidth: "25%",
    textAlign: "center",
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#d9d9d925",
    borderWidth: 1,
  },
  keyboardButtonText: {
    color: "#fff",
    fontSize: 24,
  },
  keyboardCol: {
    flexDirection: "column",
  },
  keyboard: {
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
