import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Store } from "../../stores/Store";
import { useEffect, useState } from "react";

export default function TransactionDay(props) {
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
            {props.income}€
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
            {props.expenses}€
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
    backgroundColor: "#2c2c36",
    borderRadius: 2,
    margin: 20,
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
  },
  transaction: {
    flexDirection: "column",
  },
});
