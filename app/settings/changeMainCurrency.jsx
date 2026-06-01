import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect } from "react";
import { Store } from "../../stores/Store";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Title from "../../components/Title/Title";
import Toast from "react-native-toast-message";

export default function ChangeMainCurrency() {
  const navigation = useNavigation();
  const db = Store((state) => state.db);
  const mainCurrency = Store((state) => state.mainCurrency);
  const setMainCurrency = Store((state) => state.setMainCurrency);

  const [currencies, setCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      const result = await db.getAllAsync(`
        SELECT
          uc.user_currency_id, uc.currency_id, uc.is_main,
          uc.conversion_rate_to_main, uc.display_order,
          c.currency_name, c.currency_symbol, c.currency_shorthand
        FROM user_currencies uc
        JOIN currencies c ON uc.currency_id = c.currency_id
        ORDER BY uc.display_order ASC
      `);
      setCurrencies(result);
    } catch (e) {
      console.error("fetchCurrencies error:", e);
    }
  };

  const handleSelect = (currency) => {
    if (currency.is_main) return;
    setSelectedCurrency(currency);
    setModalVisible(true);
  };

  const handleConfirm = async () => {
    setModalVisible(false);
    setLoading(true);
    try {
      const R = selectedCurrency.conversion_rate_to_main;

      await db.withTransactionAsync(async () => {
        // Recalculate rates for all non-new-main currencies
        for (const uc of currencies) {
          if (uc.currency_id === selectedCurrency.currency_id) continue;
          // old main had rate=1, so new rate for old main = 1/R
          const oldRate = uc.is_main ? 1 : uc.conversion_rate_to_main;
          const newRate = oldRate / R;
          await db.runAsync(
            `UPDATE user_currencies SET is_main = 0, conversion_rate_to_main = ? WHERE currency_id = ?`,
            [newRate, uc.currency_id]
          );
        }
        // Set new main
        await db.runAsync(
          `UPDATE user_currencies SET is_main = 1, conversion_rate_to_main = 1 WHERE currency_id = ?`,
          [selectedCurrency.currency_id]
        );
        // Rescale transaction amounts and exchange rates.
        // COALESCE handles old main-currency transactions where these fields are NULL
        // (NULL was implicit "same as main", now they need an explicit converted value).
        await db.runAsync(
          `UPDATE transactions
           SET transaction_secondCurrencyAmount = ROUND(COALESCE(transaction_secondCurrencyAmount, transaction_amount) / ?, 2),
               exchange_rate = ROUND(COALESCE(exchange_rate, 1) / ?, 6)`,
          [R, R]
        );
        // Rescale account balances
        await db.runAsync(
          `UPDATE accounts SET account_balance = ROUND(account_balance / ?, 2)`,
          [R]
        );
      });

      setMainCurrency({
        currency_id: selectedCurrency.currency_id,
        currency_name: selectedCurrency.currency_name,
        currency_symbol: selectedCurrency.currency_symbol,
        conversion_rate_to_main: 1,
      });

      Toast.show({
        type: "success",
        text1: "Main currency changed",
        text2: `${selectedCurrency.currency_name} is now your main currency.`,
      });
      navigation.goBack();
    } catch (e) {
      console.error("Change main currency error:", e);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to change main currency.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Title
        title="Main Currency"
        backIcon="arrow-back-circle-outline"
        onPressBackIcon={() => navigation.goBack()}
      />
      <View style={styles.topBlock}>
        <Text style={styles.subtitle}>Select your main currency</Text>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#734BE9"
          style={{ marginTop: 40 }}
        />
      ) : (
        <ScrollView
          style={{ width: "100%" }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        >
          {currencies.map((item) => (
            <TouchableOpacity
              key={item.currency_id}
              style={[styles.item, item.is_main && styles.itemActive]}
              onPress={() => handleSelect(item)}
              activeOpacity={item.is_main ? 1 : 0.7}
            >
              <View style={styles.itemLeft}>
                <Text style={styles.itemSymbol}>{item.currency_symbol}</Text>
                <View>
                  <Text style={styles.itemName}>{item.currency_name}</Text>
                  <Text style={styles.itemRate}>
                    {item.is_main
                      ? "Current main currency"
                      : `1 ${item.currency_symbol} = ${Number(
                          item.conversion_rate_to_main
                        ).toFixed(4)} ${mainCurrency?.currency_symbol}`}
                  </Text>
                </View>
              </View>
              {item.is_main && (
                <Ionicons name="checkmark-circle" size={26} color="#4EA758" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modal}>
                <Text style={styles.modalTitle}>Change Main Currency?</Text>
                <Text style={styles.modalMessage}>
                  Changing main currency will recalculate all stored exchange
                  rates relative to{" "}
                  <Text style={{ fontWeight: "700" }}>
                    {selectedCurrency?.currency_name}
                  </Text>
                  . Proceed?
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleConfirm}
                  >
                    <Text style={styles.confirmText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1B25",
    alignItems: "center",
  },
  topBlock: {
    alignItems: "center",
    marginBottom: 12,
  },
  subtitle: {
    color: "#aaa",
    fontSize: 16,
    textAlign: "center",
  },
  item: {
    backgroundColor: "#2C2E42",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  itemActive: {
    borderWidth: 1.5,
    borderColor: "#4EA758",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  itemSymbol: {
    color: "#9ac9e3",
    fontSize: 22,
    marginRight: 12,
    minWidth: 30,
  },
  itemName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "500",
  },
  itemRate: {
    color: "#9ac9e3",
    fontSize: 14,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "85%",
    backgroundColor: "#1A1B25",
    borderRadius: 14,
    paddingVertical: 24,
    paddingHorizontal: 22,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
    marginBottom: 12,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 16,
    color: "#ccc",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 16,
  },
  cancelButton: {
    backgroundColor: "#31323A",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  cancelText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  confirmButton: {
    backgroundColor: "#734BE9",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  confirmText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});
