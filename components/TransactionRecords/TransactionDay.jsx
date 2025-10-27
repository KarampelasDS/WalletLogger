import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Store } from "../../stores/Store";
import { useEffect, useState } from "react";

export default function TransactionDay(props) {
  const mainCurrency = Store((state) => state.mainCurrency);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.date}>
          <Text style={styles.dateDay}>{props.date}</Text>
          <Text style={styles.dateWeekday}>{props.weekday}</Text>
          <Text style={styles.dateMonthYear}>
            {props.month}.{props.year}
          </Text>
        </View>
        <View style={styles.amounts}>
          <Text
            style={{
              color: "#4EA758",
              fontWeight: "bold",
              fontSize: 20,
              width: 60,
              textAlign: "right",
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
          >
            {Number(props.income).toLocaleString("en-US", {
              maximumFractionDigits: 2,
            })}
            {mainCurrency.currency_symbol}
          </Text>

          <Text
            style={{
              color: "#CD5D5D",
              fontWeight: "bold",
              fontSize: 20,
              width: 60,
              textAlign: "right",
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
          >
            {Number(props.expenses).toLocaleString("en-US", {
              maximumFractionDigits: 2,
            })}
            {mainCurrency.currency_symbol}
          </Text>
        </View>
      </View>
      <View style={styles.transaction}>{props.children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "90%",
    backgroundColor: "#2C2E42",
    borderRadius: 2,
    marginHorizontal: 20,
    marginVertical: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomColor: "#d9d9d925",
    borderBottomWidth: 2,
    borderRadius: 1,
    alignItems: "center",
    paddingHorizontal: 10,
  },
  date: {
    flexDirection: "row",
    gap: 5,
    alignItems: "baseline",
    minWidth: "20%",
    maxWidth: "20%",
  },
  dateDay: {
    color: "#fff",
    fontSize: 24,
  },
  dateWeekday: {
    color: "#fff",
    fontSize: 24,
  },
  dateMonthYear: {
    color: "#fff",
  },
  amounts: {
    flexDirection: "row",
    gap: 20,
    alignItems: "center",
  },
  transaction: {
    flexDirection: "column",
  },
});
