import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * Explanatory tooltip.
 *
 * Two usage modes:
 *  1. Wrapper (preferred): pass `children` + `style`. The ENTIRE box becomes
 *     tappable and a small ⓘ badge is shown as a cue.
 *       <InfoTip title="..." text="..." style={styles.card} layout="corner">…</InfoTip>
 *       <InfoTip title="..." text="..." style={styles.row}  layout="inline">{<Text/>}</InfoTip>
 *  2. Icon-only: omit `children` to render just the ⓘ button (rarely needed now).
 *
 * General rule across the app: when a card/row has a tooltip, wrap the whole
 * box with InfoTip so the full area opens the explanation, not just the badge.
 */
export default function InfoTip({
  title,
  text,
  children,
  style,
  layout = "corner", // "corner" | "inline"
  badgeSize = 16,
  badgeColor = "#7a7c92",
}) {
  const [open, setOpen] = useState(false);

  const badge = (
    <Ionicons name="information-circle-outline" size={badgeSize} color={badgeColor} />
  );

  const modal = (
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <TouchableWithoutFeedback onPress={() => setOpen(false)}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              <View style={styles.header}>
                <Ionicons name="information-circle" size={22} color="#734BE9" />
                <Text style={styles.title}>{title}</Text>
              </View>
              <Text style={styles.body}>{text}</Text>
              <TouchableOpacity style={styles.btn} onPress={() => setOpen(false)}>
                <Text style={styles.btnText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  // Icon-only mode
  if (!children) {
    return (
      <>
        <TouchableOpacity
          onPress={() => setOpen(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          {badge}
        </TouchableOpacity>
        {modal}
      </>
    );
  }

  // Wrapper mode — the whole box is tappable
  return (
    <>
      <TouchableOpacity style={style} activeOpacity={0.85} onPress={() => setOpen(true)}>
        {children}
        {layout === "corner" ? (
          <View style={styles.cornerBadge}>{badge}</View>
        ) : (
          badge
        )}
      </TouchableOpacity>
      {modal}
    </>
  );
}

const styles = StyleSheet.create({
  cornerBadge: { position: "absolute", top: 6, right: 6 },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor: "#1A1B25",
    borderRadius: 6,
    padding: 20,
    width: "100%",
    borderWidth: 1,
    borderColor: "#2C2E42",
  },
  header: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  title: { color: "#fff", fontSize: 18, fontWeight: "700", flex: 1 },
  body: { color: "#bbb", fontSize: 15, lineHeight: 22 },
  btn: {
    backgroundColor: "#734BE9",
    borderRadius: 6,
    paddingVertical: 11,
    alignItems: "center",
    marginTop: 18,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
