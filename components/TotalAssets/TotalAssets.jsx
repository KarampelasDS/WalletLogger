import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Store } from "../../stores/Store";
import { useEffect, useState } from "react";

export default function TotalAssets(props) {
  const db = Store((state) => state.db);
  const mainCurrency = Store((state) => state.mainCurrency);
  const [total, setTotal] = useState([""]);

  useEffect(() => {
    async function calculateTotal() {
      const dbAccounts = await db.getAllAsync("SELECT * FROM accounts");
      let balanceTotal = 0;
      dbAccounts.map((account) => {
        balanceTotal += account.account_balance;
      });
      setTotal(balanceTotal);
    }
    calculateTotal();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={{ color: "#fff", fontSize: 15 }}>Total Balance</Text>
      <Text
        numberOfLines={1}
        ellipsizeMode="middle"
        adjustsFontSizeToFit={true}
        style={[
          styles.amountText,
          total < 0 ? { color: "#CD5D5D" } : { color: "#4EA758" },
        ]}
      >
        {total.toLocaleString("en-US", {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        })}
        {mainCurrency.currency_symbol}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    width: "100%",
    maxWidth: 130,
  },
  amountText: {
    color: "#4EA758",
    backgroundColor: "#2C2E42",
    borderRadius: 2,
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 20,
    maxWidth: "100%",
    paddingHorizontal: 4,
  },
});
