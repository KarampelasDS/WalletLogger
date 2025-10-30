import { View, Text, StyleSheet } from "react-native";
import { Store } from "../../stores/Store";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import Toast from "react-native-toast-message";
import Button from "../../components/Button/Button";
import SelectionScroller from "../../components/SelectionScroller/SelectionScroller";
import ScrollerOption from "../../components/SelectionScroller/ScrollerOption";

export default function AddUserCurrency() {
  const router = useRouter();
  const db = Store((state) => state.db);
  const [currencies, setCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [userCurrencies, setUserCurrencies] = useState([]);
  const mainCurrency = Store((state) => state.mainCurrency);

  const setSetupCurrencies = Store((state) => state.setSetupCurrencies);

  useEffect(() => {
    if (!db) return;

    const loadCurrencies = async () => {
      const allCurrencies = await db.getAllAsync("SELECT * FROM currencies");
      const ownedCurrencies = await db.getAllAsync(
        "SELECT * FROM user_currencies"
      );

      const available = allCurrencies.filter(
        (c) => !ownedCurrencies.some((uc) => uc.currency_id === c.currency_id)
      );

      setCurrencies(available);
      setUserCurrencies(ownedCurrencies);
    };

    loadCurrencies();
  }, [db]);

  const handleAddCurrency = async () => {
    if (!selectedCurrency) {
      Toast.show({ type: "error", text1: "Select a currency first" });
      return;
    }

    if (
      userCurrencies.some(
        (uc) => uc.currency_id === selectedCurrency.currency_id
      )
    ) {
      Toast.show({ type: "error", text1: "You already added this currency!" });
      return;
    }

    try {
      const refreshRateAsync = async (currency) => {
        try {
          console.log(currency);
          let response = await fetch(
            `https://api.freecurrencyapi.com/v1/latest?apikey=${process.env.EXPO_PUBLIC_CURRENCY_API}&currencies=${currency.currency_shorthand}&base_currency=${mainCurrency.currency_shorthand}`
          );
          response = await response.json();
          const rate = 1 / Object.values(response.data)[0];
          console.log(rate);
          return rate;
        } catch (e) {
          console.log(e);
        }
      };

      await db.runAsync(
        `INSERT INTO user_currencies (currency_id, is_main, conversion_rate_to_main, display_order)
         VALUES (?, 0, ?, ?)`,
        [
          selectedCurrency.currency_id,
          await refreshRateAsync(selectedCurrency),
          Date.now(),
        ]
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
    } catch (err) {
      console.error(err);
      Toast.show({ type: "error", text1: "Failed to add currency" });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select a Currency to Add</Text>

      <SelectionScroller>
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
          function={handleAddCurrency}
          backgroundColor={"#2C2E42"}
          enabled={!!selectedCurrency}
        >
          Add Currency
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", paddingTop: "10%" },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  option: {
    width: "85%",
    marginVertical: 6,
    backgroundColor: "#2C2E42",
    borderRadius: 14,
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
    color: "#9ac9e3",
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
  buttons: { position: "absolute", bottom: 100, width: "80%" },
});
