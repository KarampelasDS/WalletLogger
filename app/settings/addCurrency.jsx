import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import { Store } from "../../stores/Store";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import Toast from "react-native-toast-message";
import Button from "../../components/Button/Button";
import SelectionScroller from "../../components/SelectionScroller/SelectionScroller";
import ScrollerOption from "../../components/SelectionScroller/ScrollerOption";
import Title from "../../components/Title/Title";
import { useNavigation } from "expo-router";
import { ensureCurrencyCatalogue } from "../../constants/currencies";

export default function AddUserCurrency() {
  const router = useRouter();
  const db = Store((state) => state.db);
  const [currencies, setCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [userCurrencies, setUserCurrencies] = useState([]);
  const mainCurrency = Store((state) => state.mainCurrency);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  // Manual-rate fallback (shown when the online rate can't be fetched)
  const [manualMode, setManualMode] = useState(false);
  const [manualRate, setManualRate] = useState("");

  const setSetupCurrencies = Store((state) => state.setSetupCurrencies);

  useEffect(() => {
    if (!db) return;

    const loadCurrencies = async () => {
      try {
        // Self-heal: make sure the full built-in catalogue is present even if a
        // previous import trimmed the currencies table.
        await ensureCurrencyCatalogue(db);

        const allCurrencies = await db.getAllAsync("SELECT * FROM currencies");
        const ownedCurrencies = await db.getAllAsync(
          "SELECT * FROM user_currencies"
        );

        const available = allCurrencies.filter(
          (c) => !ownedCurrencies.some((uc) => uc.currency_id === c.currency_id)
        );

        setCurrencies(available);
        setUserCurrencies(ownedCurrencies);
      } catch (err) {
        console.error("Failed to load currencies:", err);
        Toast.show({ type: "error", text1: "Failed to load currencies" });
      }
    };

    loadCurrencies();
  }, [db]);

  // Reset manual mode whenever the chosen currency changes
  useEffect(() => {
    setManualMode(false);
    setManualRate("");
  }, [selectedCurrency]);

  const insertCurrency = async (rate) => {
    await db.runAsync(
      `INSERT INTO user_currencies (currency_id, is_main, conversion_rate_to_main, display_order)
       VALUES (?, 0, ?, ?)`,
      [selectedCurrency.currency_id, rate, Date.now()]
    );

    setUserCurrencies((prev) => [...prev, selectedCurrency]);
    setCurrencies((prev) =>
      prev.filter((c) => c.currency_id !== selectedCurrency.currency_id)
    );
    setSetupCurrencies((prev) => [...prev, selectedCurrency]);

    Toast.show({
      type: "success",
      text1: `${selectedCurrency.currency_name} added!`,
    });
    router.back();
  };

  const fetchRate = async (currency) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      let response = await fetch(
        `https://api.freecurrencyapi.com/v1/latest?apikey=${process.env.EXPO_PUBLIC_CURRENCY_API}&currencies=${currency.currency_shorthand}&base_currency=${mainCurrency.currency_shorthand}`,
        { signal: controller.signal }
      );
      response = await response.json();
      const value = Object.values(response?.data || {})[0];
      if (!value || !isFinite(value)) throw new Error("No rate returned");
      return 1 / value;
    } catch (e) {
      if (e.name === "AbortError") throw new Error("Request timed out");
      throw e;
    } finally {
      clearTimeout(timeout);
    }
  };

  const handleAddOnline = async () => {
    if (!selectedCurrency) {
      Toast.show({ type: "error", text1: "Select a currency first" });
      return;
    }
    setLoading(true);
    try {
      const rate = await fetchRate(selectedCurrency);
      await insertCurrency(rate);
    } catch (err) {
      console.error(err);
      // Offer the manual fallback instead of just failing
      setManualMode(true);
      Toast.show({
        type: "error",
        text1: "Couldn't fetch the exchange rate",
        text2: "Enter it manually below, or retry.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddManual = async () => {
    const rate = parseFloat(manualRate);
    if (!rate || rate <= 0) {
      Toast.show({ type: "error", text1: "Enter a valid exchange rate" });
      return;
    }
    setLoading(true);
    try {
      await insertCurrency(rate);
    } catch (err) {
      console.error(err);
      Toast.show({ type: "error", text1: "Failed to add currency, try again" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Title
        title="Add Currency"
        backIcon="arrow-back-circle-outline"
        onPressBackIcon={() => navigation.goBack()}
      />
      <SelectionScroller maxHeight={65}>
        {currencies.map((currency, index) => (
          <ScrollerOption
            key={currency.currency_id}
            active={selectedCurrency?.currency_id === currency.currency_id}
            function={() => setSelectedCurrency(currency)}
            style={[
              styles.option,
              selectedCurrency?.currency_id === currency.currency_id &&
                styles.optionActive,
              index === 0 && styles.optionFirst,
              index === currencies.length - 1 && styles.optionLast,
            ]}
          >
            <View style={styles.currencyRow}>
              <Text style={styles.optionSymbol}>
                {currency.currency_symbol}
              </Text>
              <Text style={styles.optionText}>{currency.currency_name}</Text>
            </View>
          </ScrollerOption>
        ))}
        {currencies.length === 0 && (
          <Text style={{ color: "#aaa", textAlign: "center", marginTop: 20 }}>
            You already have all currencies.
          </Text>
        )}
      </SelectionScroller>

      <View style={styles.buttons}>
        <Button
          function={handleAddOnline}
          backgroundColor={"#2C2E42"}
          disabledColor={"#33343fff"}
          enabled={!loading && !!selectedCurrency && !manualMode}
        >
          {loading && !manualMode ? (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <ActivityIndicator color="#fff" size="small" />
              <Text style={{ color: "#fff", fontSize: 18 }}>Adding...</Text>
            </View>
          ) : (
            "Done"
          )}
        </Button>
      </View>

      {/* Manual exchange-rate entry — shown when the online rate can't be fetched */}
      <Modal
        visible={manualMode && !!selectedCurrency}
        transparent
        animationType="fade"
        onRequestClose={() => setManualMode(false)}
      >
        <TouchableWithoutFeedback onPress={() => setManualMode(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Set exchange rate</Text>
                <Text style={styles.modalSub}>
                  Couldn't fetch the rate for{" "}
                  {selectedCurrency?.currency_name}. Enter it manually:
                </Text>

                <View style={styles.manualRow}>
                  <Text style={styles.manualLabel}>
                    1 {selectedCurrency?.currency_shorthand} =
                  </Text>
                  <TextInput
                    style={styles.manualInput}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor="#666"
                    value={manualRate}
                    autoFocus
                    onChangeText={(v) => setManualRate(v.replace(/[^0-9.]/g, ""))}
                  />
                  <Text style={styles.manualLabel}>
                    {mainCurrency?.currency_shorthand || ""}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.modalAdd,
                    (!manualRate || parseFloat(manualRate) <= 0 || loading) &&
                      styles.modalAddDisabled,
                  ]}
                  disabled={!manualRate || parseFloat(manualRate) <= 0 || loading}
                  onPress={handleAddManual}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.modalAddText}>Add with this rate</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalRetry}
                  disabled={loading}
                  onPress={handleAddOnline}
                >
                  <Text style={styles.modalRetryText}>↻ Retry fetching online</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ marginTop: 6 }}
                  onPress={() => setManualMode(false)}
                >
                  <Text style={styles.modalCancel}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center" },
  option: {
    width: "85%",
    marginVertical: 6,
    backgroundColor: "#2C2E42",
    borderRadius: 6,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    alignSelf: "center",
  },
  currencyRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  optionSymbol: {
    color: "#A78BFA",
    fontSize: 22,
    fontWeight: "600",
    width: "auto",
  },
  optionText: { color: "#fff", fontSize: 18, fontWeight: "500", width: "auto" },
  optionActive: {
    backgroundColor: "#3C4360",
    borderWidth: 1.5,
    borderColor: "#42A5F5",
    shadowColor: "#42A5F5",
    shadowOpacity: 0.4,
  },
  optionFirst: { marginTop: 14 },
  optionLast: { marginBottom: 20 },
  buttons: { position: "absolute", bottom: "100", width: "80%" },

  // ── Manual-rate modal ──────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "85%",
    backgroundColor: "#1A1B25",
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#fff",
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  modalTitle: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 8 },
  modalSub: {
    color: "#aaa",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 18,
  },
  manualRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
    marginBottom: 20,
  },
  manualLabel: { color: "#ddd", fontSize: 16 },
  manualInput: {
    flex: 1,
    backgroundColor: "#2C2E42",
    borderRadius: 6,
    color: "#fff",
    fontSize: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlign: "center",
  },
  modalAdd: {
    backgroundColor: "#734BE9",
    borderRadius: 6,
    width: "100%",
    paddingVertical: 14,
    alignItems: "center",
  },
  modalAddDisabled: { backgroundColor: "#3A3556" },
  modalAddText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  modalRetry: { marginTop: 14 },
  modalRetryText: { color: "#A78BFA", fontSize: 15, fontWeight: "500" },
  modalCancel: { color: "#aaa", fontSize: 16, marginTop: 6 },
});
