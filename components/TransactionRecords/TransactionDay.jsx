import { View, Text, StyleSheet } from "react-native";
import { Store } from "../../stores/Store";
import { fmtAmount } from "../../utils/format";

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
          <Text style={styles.incomeText} numberOfLines={1}>
            {fmtAmount(props.income)}
            {mainCurrency ? mainCurrency.currency_symbol : ""}
          </Text>
          <Text style={styles.expenseText} numberOfLines={1}>
            {fmtAmount(props.expenses)}
            {mainCurrency ? mainCurrency.currency_symbol : ""}
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
    borderRadius: 14,
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
    paddingVertical: 4,
  },
  date: {
    flexDirection: "row",
    gap: 5,
    alignItems: "baseline",
    flexShrink: 0,
  },
  dateDay: {
    color: "#A78BFA",
    fontSize: 22,
  },
  dateWeekday: {
    color: "#A78BFA",
    fontSize: 18,
  },
  dateMonthYear: {
    color: "#A78BFA",
    fontSize: 13,
  },
  amounts: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    flexShrink: 1,
    flexGrow: 0,
    marginLeft: 8,
  },
  incomeText: {
    color: "#4EA758",
    fontWeight: "bold",
    fontSize: 16,
    flexShrink: 1,
    textAlign: "right",
  },
  expenseText: {
    color: "#CD5D5D",
    fontWeight: "bold",
    fontSize: 16,
    flexShrink: 1,
    textAlign: "right",
  },
  transaction: {
    flexDirection: "column",
  },
});
