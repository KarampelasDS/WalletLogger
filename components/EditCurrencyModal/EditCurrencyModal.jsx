import { useState, useEffect } from "react";
import {
  View,
  Modal,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function EditCurrencyModal({
  visible,
  onClose,
  currency,
  mainCurrencySymbol,
  initialRate,
  onSave,
  refreshRateAsync,
}) {
  const [rate, setRate] = useState(
    initialRate ? Number(initialRate).toFixed(12) : ""
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRate(initialRate ? Number(initialRate).toFixed(12) : "");
    setLoading(false);
  }, [visible, initialRate]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const newRate = await refreshRateAsync(currency);
      setRate(Number(newRate).toFixed(12));
    } catch (e) {
      console.log(e);
    }
    setLoading(false);
  };

  const handleRateChange = (val) => {
    let str = val.replace(/[^0-9.]/g, "");
    if ((str.match(/\./g) || []).length > 1) return;
    if (str.includes(".") && str.split(".")[1].length > 12) return;
    setRate(str);
  };

  const isSaveAllowed = rate && Number(rate) > 0 && !isNaN(Number(rate));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.bg}>
        <View style={styles.modal}>
          {!currency ? (
            <ActivityIndicator size="large" color="#9ac9e3" />
          ) : (
            <>
              <Text style={styles.title}>Edit Exchange Rate</Text>
              <Text style={styles.label}>
                1.00{" "}
                <Text style={{ color: "#9ac9e3" }}>
                  {currency.currency_symbol}
                </Text>{" "}
                =
                <Text style={{ color: "#9ac9e3", fontWeight: "bold" }}>
                  {" "}
                  {mainCurrencySymbol}
                </Text>{" "}
                {rate}
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={rate}
                  keyboardType="numeric"
                  onChangeText={handleRateChange}
                  placeholder="Custom rate"
                  placeholderTextColor="#bbb"
                  maxLength={12}
                />
                <TouchableOpacity
                  style={styles.refresh}
                  onPress={handleRefresh}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#9ac9e3" />
                  ) : (
                    <Ionicons name="reload-outline" size={28} color="#9ac9e3" />
                  )}
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  { opacity: isSaveAllowed ? 1 : 0.5 },
                ]}
                disabled={!isSaveAllowed}
                onPress={() => onSave(Number(rate))}
              >
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.cancel}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#1A1B25",
    width: "82%",
    padding: 20,
    borderRadius: 14,
    alignItems: "center",
    borderColor: "#fff",
    borderWidth: 2,
    minHeight: 220,
  },
  title: {
    color: "white",
    fontSize: 25,
    fontWeight: "700",
    marginBottom: 14,
  },
  label: {
    color: "#bbb",
    fontSize: 17,
    marginBottom: 18,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    width: "100%",
  },
  input: {
    backgroundColor: "#282A3B",
    color: "white",
    fontSize: 20,
    paddingVertical: 7,
    paddingHorizontal: 10,
    flex: 1,
    borderRadius: 10,
    marginRight: 8,
  },
  refresh: {
    padding: 8,
  },
  saveButton: {
    backgroundColor: "#9ac9e3",
    borderRadius: 8,
    paddingVertical: 12,
    width: "90%",
    alignItems: "center",
    marginBottom: 8,
  },
  saveText: {
    color: "#121325",
    fontWeight: "bold",
    fontSize: 21,
  },
  cancel: {
    marginTop: 6,
  },
  cancelText: {
    color: "#bbb",
    fontSize: 18,
  },
});
