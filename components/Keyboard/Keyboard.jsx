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
import Toast from "react-native-toast-message";
import { normalizeAmount } from "../../utils/format";

const { height: screenHeight } = Dimensions.get("window");
const minHeight = 0.38 * screenHeight;
const calcHeight = minHeight + 130;

// Evaluate a simple arithmetic expression (+ - * /) with correct precedence.
function evalExpr(raw) {
  const tokens = String(raw).match(/(\d+\.?\d*|\.\d+|[+\-*/])/g);
  if (!tokens || !tokens.length) return null;
  while (tokens.length && /[+\-*/]/.test(tokens[tokens.length - 1])) tokens.pop();
  if (!tokens.length) return null;

  // pass 1: * and /
  const p1 = [tokens[0]];
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i], num = tokens[i + 1];
    if (num === undefined) break;
    if (op === "*" || op === "/") {
      const a = parseFloat(p1.pop());
      const b = parseFloat(num);
      p1.push(op === "*" ? a * b : b === 0 ? NaN : a / b);
    } else { p1.push(op); p1.push(num); }
  }
  // pass 2: + and -
  let res = parseFloat(p1[0]);
  for (let i = 1; i < p1.length; i += 2) {
    const op = p1[i], num = parseFloat(p1[i + 1]);
    if (op === "+") res += num;
    else if (op === "-") res -= num;
  }
  return res;
}

const round2 = (n) => Math.round(n * 100) / 100;

export default function Keyboard(props) {
  const iconSize = Store((state) => state.iconSize);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [expr, setExpr] = useState("");

  const updateValue = (val) => {
    let str = props.value.toString();
    if (val === "." && str.includes(".")) return;
    let nextStr = str === "0" && val !== "." ? val : str + val;
    if (nextStr.includes(".") && nextStr.split(".")[1].length > 2) {
      nextStr = nextStr.slice(0, -2) + val;
      props.valueUpdateFunction(nextStr);
      return;
    }
    if (nextStr.length > 14 && val !== ".") {
      if (nextStr.includes(".") && nextStr.length <= 17) {
        props.valueUpdateFunction(nextStr);
        return;
      }
      return;
    }
    props.valueUpdateFunction(nextStr);
  };

  const backspaceValue = () => props.valueUpdateFunction((prev) => prev.slice(0, -1));
  const trashValue = () => props.valueUpdateFunction("");
  const Done = () => props.closeKeyboard();

  // ── Calculator helpers ──────────────────────────────────────────────────────
  const openCalculator = () => {
    setExpr(props.value ? String(props.value) : "");
    setShowCalculator(true);
  };

  const calcPress = (ch) => {
    setExpr((prev) => {
      if (ch === ".") {
        const lastNum = prev.split(/[+\-*/]/).pop();
        if (lastNum.includes(".")) return prev;
        if (prev === "" || /[+\-*/]$/.test(prev)) return prev + "0.";
        return prev + ".";
      }
      if (/[+\-*/]/.test(ch)) {
        if (prev === "") return ch === "-" ? "-" : prev;
        if (/[+\-*/]$/.test(prev)) return prev.slice(0, -1) + ch;
        return prev + ch;
      }
      return prev + ch;
    });
  };

  const calcResult = evalExpr(expr);
  // preview shows exactly what will be exported (same rules as the amount field)
  const calcPreview =
    calcResult == null || isNaN(calcResult) ? "" : normalizeAmount(calcResult);

  const calcEquals = () => {
    if (calcResult == null || isNaN(calcResult)) return;
    setExpr(String(round2(calcResult)));
  };

  const calcApply = () => {
    if (calcResult == null || isNaN(calcResult)) {
      Toast.show({ type: "error", text1: "Invalid expression" });
      return;
    }
    props.valueUpdateFunction(normalizeAmount(calcResult));
    setShowCalculator(false);
    props.closeKeyboard();
  };

  const prettyExpr = expr.replace(/\*/g, " × ").replace(/\//g, " ÷ ").replace(/-/g, " − ").replace(/\+/g, " + ");

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Numeric keypad */}
      {!showCurrencyPicker && !showCalculator && (
        <View style={styles.container} onStartShouldSetResponder={() => true}>
          <KeyboardHeader text={props.headerText} backgroundColor={props.headerBackgroundColor} />
          <View>
            <View style={styles.keyboardRow}>
              <TouchableOpacity style={styles.keyboardButton} onPress={() => updateValue("1")}><Text style={styles.keyboardButtonText}>1</Text></TouchableOpacity>
              <TouchableOpacity style={styles.keyboardButton} onPress={() => updateValue("2")}><Text style={styles.keyboardButtonText}>2</Text></TouchableOpacity>
              <TouchableOpacity style={styles.keyboardButton} onPress={() => updateValue("3")}><Text style={styles.keyboardButtonText}>3</Text></TouchableOpacity>
              <TouchableOpacity style={styles.keyboardButton} onPress={backspaceValue}><Ionicons name="backspace" size={iconSize} color="#fff" /></TouchableOpacity>
            </View>
            <View style={styles.keyboardRow}>
              <TouchableOpacity style={styles.keyboardButton} onPress={() => updateValue("4")}><Text style={styles.keyboardButtonText}>4</Text></TouchableOpacity>
              <TouchableOpacity style={styles.keyboardButton} onPress={() => updateValue("5")}><Text style={styles.keyboardButtonText}>5</Text></TouchableOpacity>
              <TouchableOpacity style={styles.keyboardButton} onPress={() => updateValue("6")}><Text style={styles.keyboardButtonText}>6</Text></TouchableOpacity>
              <TouchableOpacity
                style={styles.keyboardButton}
                onPress={() =>
                  props.allowExchange
                    ? setShowCurrencyPicker(true)
                    : Toast.show({ type: "error", text1: "Error", text2: "Cannot change currency on transfer transactions" })
                }
              >
                <Ionicons name="cash" size={iconSize} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.keyboardRow}>
              <TouchableOpacity style={styles.keyboardButton} onPress={() => updateValue("7")}><Text style={styles.keyboardButtonText}>7</Text></TouchableOpacity>
              <TouchableOpacity style={styles.keyboardButton} onPress={() => updateValue("8")}><Text style={styles.keyboardButtonText}>8</Text></TouchableOpacity>
              <TouchableOpacity style={styles.keyboardButton} onPress={() => updateValue("9")}><Text style={styles.keyboardButtonText}>9</Text></TouchableOpacity>
              <TouchableOpacity style={styles.keyboardButton} onPress={openCalculator}><Ionicons name="calculator" size={iconSize} color="#fff" /></TouchableOpacity>
            </View>
            <View style={styles.keyboardRow}>
              <TouchableOpacity style={styles.keyboardButton} onPress={trashValue}><Ionicons name="trash" size={iconSize} color="#fff" /></TouchableOpacity>
              <TouchableOpacity style={styles.keyboardButton} onPress={() => updateValue("0")}><Text style={styles.keyboardButtonText}>0</Text></TouchableOpacity>
              <TouchableOpacity style={styles.keyboardButton} onPress={() => updateValue(".")}><Text style={styles.keyboardButtonText}>.</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.keyboardButton, { backgroundColor: props.typeColor }]} onPress={Done}>
                <Text style={[styles.keyboardButtonText, { fontSize: 18 }]}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Calculator */}
      {showCalculator && (
        <View style={[styles.container, { minHeight: calcHeight }]} onStartShouldSetResponder={() => true}>
          <KeyboardHeader text="Calculator" backgroundColor={props.headerBackgroundColor} />
          <View style={styles.calcDisplay}>
            <Text style={styles.calcExpr} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
              {prettyExpr || "0"}
            </Text>
            <Text style={styles.calcPreview} numberOfLines={1}>
              {calcPreview !== "" ? `= ${calcPreview}` : ""}
            </Text>
          </View>
          <View>
            <View style={styles.keyboardRow}>
              <TouchableOpacity style={styles.calcOp} onPress={() => setExpr("")}><Text style={styles.calcOpText}>C</Text></TouchableOpacity>
              <TouchableOpacity style={styles.calcOp} onPress={() => setExpr((p) => p.slice(0, -1))}><Ionicons name="backspace" size={iconSize} color="#fff" /></TouchableOpacity>
              <TouchableOpacity style={styles.calcOp} onPress={() => calcPress("/")}><Text style={styles.calcOpText}>÷</Text></TouchableOpacity>
              <TouchableOpacity style={styles.calcOp} onPress={() => calcPress("*")}><Text style={styles.calcOpText}>×</Text></TouchableOpacity>
            </View>
            <View style={styles.keyboardRow}>
              <TouchableOpacity style={styles.keyboardButton} onPress={() => calcPress("7")}><Text style={styles.keyboardButtonText}>7</Text></TouchableOpacity>
              <TouchableOpacity style={styles.keyboardButton} onPress={() => calcPress("8")}><Text style={styles.keyboardButtonText}>8</Text></TouchableOpacity>
              <TouchableOpacity style={styles.keyboardButton} onPress={() => calcPress("9")}><Text style={styles.keyboardButtonText}>9</Text></TouchableOpacity>
              <TouchableOpacity style={styles.calcOp} onPress={() => calcPress("-")}><Text style={styles.calcOpText}>−</Text></TouchableOpacity>
            </View>
            <View style={styles.keyboardRow}>
              <TouchableOpacity style={styles.keyboardButton} onPress={() => calcPress("4")}><Text style={styles.keyboardButtonText}>4</Text></TouchableOpacity>
              <TouchableOpacity style={styles.keyboardButton} onPress={() => calcPress("5")}><Text style={styles.keyboardButtonText}>5</Text></TouchableOpacity>
              <TouchableOpacity style={styles.keyboardButton} onPress={() => calcPress("6")}><Text style={styles.keyboardButtonText}>6</Text></TouchableOpacity>
              <TouchableOpacity style={styles.calcOp} onPress={() => calcPress("+")}><Text style={styles.calcOpText}>+</Text></TouchableOpacity>
            </View>
            <View style={styles.keyboardRow}>
              <TouchableOpacity style={styles.keyboardButton} onPress={() => calcPress("1")}><Text style={styles.keyboardButtonText}>1</Text></TouchableOpacity>
              <TouchableOpacity style={styles.keyboardButton} onPress={() => calcPress("2")}><Text style={styles.keyboardButtonText}>2</Text></TouchableOpacity>
              <TouchableOpacity style={styles.keyboardButton} onPress={() => calcPress("3")}><Text style={styles.keyboardButtonText}>3</Text></TouchableOpacity>
              <TouchableOpacity style={styles.calcOp} onPress={calcEquals}><Text style={styles.calcOpText}>=</Text></TouchableOpacity>
            </View>
            <View style={styles.keyboardRow}>
              <TouchableOpacity style={styles.keyboardButton} onPress={() => calcPress("0")}><Text style={styles.keyboardButtonText}>0</Text></TouchableOpacity>
              <TouchableOpacity style={styles.keyboardButton} onPress={() => calcPress(".")}><Text style={styles.keyboardButtonText}>.</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.calcApply, { backgroundColor: props.typeColor }]} onPress={calcApply}>
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={[styles.keyboardButtonText, { fontSize: 17, marginLeft: 4 }]}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Currency picker */}
      {showCurrencyPicker && (
        <View style={[styles.currencyPicker, { minHeight: minHeight + 85 }]} onStartShouldSetResponder={() => true}>
          <KeyboardHeader text={props.headerText} backgroundColor={props.headerBackgroundColor} />
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
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1002 },
  container: {
    position: "absolute", left: 0, right: 0, bottom: 0, minHeight: minHeight,
    backgroundColor: "#363642", zIndex: 1002, overflow: "hidden", paddingBottom: 6,
  },
  keyboardRow: { flexDirection: "row", backgroundColor: "#363642" },
  keyboardButton: {
    padding: 20, minWidth: "25%", alignItems: "center", justifyContent: "center",
    borderColor: "#d9d9d925", borderWidth: 1, backgroundColor: "transparent",
  },
  keyboardButtonText: { color: "#fff", fontSize: 24 },

  // Calculator
  calcDisplay: {
    paddingHorizontal: 18, paddingVertical: 10, minHeight: 56, justifyContent: "center",
    borderBottomColor: "#d9d9d925", borderBottomWidth: 1,
  },
  calcExpr: { color: "#fff", fontSize: 26, fontWeight: "600", textAlign: "right" },
  calcPreview: { color: "#A78BFA", fontSize: 15, textAlign: "right", marginTop: 2 },
  calcOp: {
    padding: 20, minWidth: "25%", alignItems: "center", justifyContent: "center",
    borderColor: "#d9d9d925", borderWidth: 1, backgroundColor: "#2C2E42",
  },
  calcOpText: { color: "#A78BFA", fontSize: 26, fontWeight: "700" },
  calcApply: {
    flexDirection: "row", padding: 20, minWidth: "50%", alignItems: "center",
    justifyContent: "center", borderColor: "#d9d9d925", borderWidth: 1,
  },

  currencyPicker: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    backgroundColor: "#363642", zIndex: 1002, overflow: "hidden",
  },
});
