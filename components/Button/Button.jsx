import { Text, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS } from "../../constants/theme";

/**
 * App-wide action button.
 *
 * variant: "primary" (default, purple) | "danger" (red).
 * Legacy `backgroundColor` / `disabledColor` props are intentionally ignored so
 * every button stays consistent with the theme — use `variant` instead.
 */
export default function Button(props) {
  const variant = props.variant === "danger" ? "danger" : "primary";

  const enabledColor =
    variant === "danger" ? COLORS.danger : COLORS.primary;
  const disabledColor =
    variant === "danger" ? COLORS.dangerDisabled : COLORS.primaryDisabled;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={props.enabled ? props.function : props.functionDisabled}
      style={[
        styles.container,
        { backgroundColor: props.enabled ? enabledColor : disabledColor },
      ]}
    >
      <Text style={[styles.text, !props.enabled && styles.textDisabled]}>
        {props.children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 13,
    paddingHorizontal: 80,
    borderRadius: 14,
    // boxShadow follows borderRadius (square shadow* / elevation does not)
    boxShadow: "0px 3px 8px rgba(0,0,0,0.28)",
  },
  text: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  textDisabled: {
    color: "#9b97ad",
  },
});
