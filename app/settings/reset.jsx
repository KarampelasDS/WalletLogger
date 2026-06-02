import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import Title from "../../components/Title/Title";
import ConfirmModal from "../../components/ConfrimModal/ConfirmModal";
import { Store } from "../../stores/Store";
import { wipeDatabase } from "../../utils/backup";

export default function ResetApp() {
  const router = useRouter();
  const db = Store((state) => state.db);
  const iconSize = Store((state) => state.iconSize);
  const setMainCurrency = Store((state) => state.setMainCurrency);
  const setDbUpToDate = Store((state) => state.setDbUpToDate);
  const setCompletedSetup = Store((state) => state.setCompletedSetup);
  const setSetupAccounts = Store((state) => state.setSetupAccounts);
  const setSetupCurrencies = Store((state) => state.setSetupCurrencies);
  const setSetupIncomeCategories = Store((state) => state.setSetupIncomeCategories);
  const setSetupExpenseCategories = Store((state) => state.setSetupExpenseCategories);

  const [busy, setBusy] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReset = async () => {
    setShowConfirm(false);
    if (busy) return;
    setBusy(true);
    try {
      await wipeDatabase(db);
      // Clear persisted setup state so onboarding starts fresh
      setMainCurrency(null);
      setSetupAccounts([]);
      setSetupCurrencies([]);
      setSetupIncomeCategories([]);
      setSetupExpenseCategories([]);
      setDbUpToDate(false);
      setCompletedSetup(null);
      Toast.show({ type: "success", text1: "App reset" });
      router.replace("/setup/SetupScreen1");
    } catch (err) {
      console.error("Reset failed:", err);
      Toast.show({ type: "error", text1: "Reset failed", text2: String(err.message || err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Title
        title="Reset App"
        backIcon="chevron-back-outline"
        onPressBackIcon={() => router.back()}
      />

      <View style={styles.body}>
        <Text style={styles.blurb}>
          This permanently erases all your transactions, accounts, categories and
          currencies, then takes you back through setup as if the app were brand
          new. This cannot be undone — export a backup first if you want to keep
          your data.
        </Text>

        <TouchableOpacity
          style={[styles.card, busy && styles.cardDisabled]}
          activeOpacity={0.8}
          onPress={() => setShowConfirm(true)}
          disabled={busy}
        >
          <Ionicons name="trash-outline" size={iconSize + 4} color="#fff" />
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Erase all data</Text>
            <Text style={styles.cardSub}>Reset everything and start setup over</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ConfirmModal
        visible={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleReset}
        itemName="all your data and reset the app"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1B25",
    alignItems: "center",
  },
  body: {
    width: "90%",
    gap: 12,
  },
  blurb: {
    color: "#B9BACA",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#2C2E42",
    padding: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#CD5D5D55",
  },
  cardDisabled: {
    opacity: 0.5,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  cardSub: {
    color: "#8E8FA3",
    fontSize: 13,
    marginTop: 2,
  },
});
