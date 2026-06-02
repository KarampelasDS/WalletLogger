import { View, Text, StyleSheet } from "react-native";
import { Store } from "../../stores/Store";
import { useEffect, useState } from "react";
import { fmtAmount } from "../../utils/format";

export default function TotalAssets() {
  const db = Store((state) => state.db);
  const mainCurrency = Store((state) => state.mainCurrency);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function calculateTotal() {
      const dbAccounts = await db.getAllAsync("SELECT * FROM accounts");
      let balanceTotal = 0;
      dbAccounts.forEach((account) => {
        balanceTotal += account.account_balance;
      });
      setTotal(balanceTotal);
    }
    calculateTotal();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Total Balance</Text>
      <Text
        numberOfLines={1}
        style={[
          styles.amountText,
          total < 0 ? { color: "#CD5D5D" } : { color: "#4EA758" },
        ]}
      >
        {fmtAmount(total)}
        {mainCurrency ? mainCurrency.currency_symbol : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    maxWidth: 140,
  },
  label: {
    color: "#fff",
    fontSize: 13,
  },
  amountText: {
    backgroundColor: "#2C2E42",
    borderRadius: 3,
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
    width: 140,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
});
