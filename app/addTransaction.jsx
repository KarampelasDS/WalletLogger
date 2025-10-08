import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Title from "../components/Title/Title";
import { useNavigation } from "@react-navigation/native";
import * as SQLite from "expo-sqlite";
import { useEffect, useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Store } from "../stores/Store";
import Keyboard from "../components/Keyboard/Keyboard";

const addTransaction = () => {
  const navigation = useNavigation();
  const [transactionType, setTransactionType] = useState("Expense");
  const [focusedInput, setFocusedInput] = useState(null);

  //Date Picking
  const [transactionDate, setTransactionDate] = useState(new Date());
  const [datePickerMode, setDatePickerMode] = useState("date");
  const [showDatePickerMode, setShowDatePickerMode] = useState(false);

  const onChange = (event, transactionDate) => {
    const currentDate = transactionDate;
    setShowDatePickerMode(false);
    setTransactionDate(currentDate);
  };

  const showMode = (currentMode) => {
    setShowDatePickerMode(true);
    setDatePickerMode(currentMode);
  };

  const showDatepicker = () => {
    showMode("date");
  };

  const showTimepicker = () => {
    showMode("time");
  };

  //Amount Picking
  const [transactionAmount, setTransactionAmount] = useState("");
  const [showAmountKeyboard, setShowAmountKeyboard] = useState(false);
  const setShowNavbar = Store((state) => state.setShowNavbar);

  const openKeyboard = () => {
    setShowAmountKeyboard(true);
    setShowNavbar(false);
    setFocusedInput("Amount");
  };

  const closeKeyboard = () => {
    setShowAmountKeyboard(false);
    setShowNavbar(true);
    setFocusedInput(null);
  };

  //Category Picking
  const [transactionCategory, setTransactionCategory] = useState("");
  const [showCategoryPicker, setShowCategoryPicker] = useState(true);
  const [storedCategories, setStoredCategories] = useState([]);
  const LoadCategories = async () => {
    const db = await SQLite.openDatabaseAsync("ExpenseManager.db");
    if (!db) {
      console.error("Could not open DB");
      return;
    }
    const categories = await db.getAllAsync("SELECT * FROM categories");
    setStoredCategories(categories);
  };

  useEffect(() => {
    LoadCategories();
  }, []);

  const colors = {
    Income: "#4EA758",
    Expense: "#CD5D5D",
    Transfer: "#734BE9",
  };

  return (
    <View style={styles.container}>
      <Title
        title="Add Transaction"
        backIcon="arrow-back-circle-outline"
        onPressBackIcon={() => {
          navigation.goBack();
        }}
      />
      <View style={styles.typeSelector}>
        <TouchableOpacity onPress={() => setTransactionType("Income")}>
          <Text
            style={[
              styles.type,
              transactionType == "Income"
                ? {
                    color: colors["Income"],
                    borderWidth: 1,
                    borderColor: colors["Income"],
                  }
                : {},
            ]}
          >
            Income
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTransactionType("Expense")}>
          <Text
            style={[
              styles.type,
              transactionType == "Expense"
                ? {
                    color: colors["Expense"],
                    borderWidth: 1,
                    borderColor: colors["Expense"],
                  }
                : {},
            ]}
          >
            Expense
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTransactionType("Transfer")}>
          <Text
            style={[
              styles.type,
              transactionType == "Transfer"
                ? {
                    color: colors["Transfer"],
                    borderWidth: 1,
                    borderColor: colors["Transfer"],
                  }
                : {},
            ]}
          >
            Transfer
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.TransactionDetails}>
        <View style={styles.TransactionDetailsRow}>
          <Text style={styles.TransactionDetailName}>Date</Text>
          <Text
            style={[
              styles.TransactionDetailValue,
              focusedInput == "Date" && {
                borderBottomColor: colors[transactionType],
              },
            ]}
          >
            <Text
              onPress={() => {
                showDatepicker();
                closeKeyboard();
                setFocusedInput("Date");
              }}
            >
              {"("}
              {transactionDate.toLocaleString("en-GB", {
                weekday: "short",
              })}
              {") "}
            </Text>
            <Text
              onPress={() => {
                showDatepicker();
                closeKeyboard();
                setFocusedInput("Date");
              }}
            >
              {transactionDate.toLocaleString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}{" "}
            </Text>
            <Text
              onPress={() => {
                showTimepicker();
                closeKeyboard();
                setShowNavbar(true);
                setFocusedInput("Date");
              }}
            >
              {transactionDate.toLocaleString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </Text>
          </Text>
          {showDatePickerMode && (
            <DateTimePicker
              testID="dateTimePicker"
              value={transactionDate}
              mode={datePickerMode}
              is24Hour={true}
              onChange={onChange}
            />
          )}
        </View>
        <View style={styles.TransactionDetailsRow}>
          <Text style={styles.TransactionDetailName}>Amount</Text>
          <Text
            onPress={() => {
              openKeyboard();
              setShowNavbar(false);
              setFocusedInput("Amount");
            }}
            style={[
              styles.TransactionDetailValue,
              focusedInput == "Amount" && {
                borderBottomColor: colors[transactionType],
              },
            ]}
          >
            {transactionAmount == "."
              ? "0."
              : Number(transactionAmount).toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })}
            {transactionAmount[transactionAmount.length - 1] === "." &&
            transactionAmount != "."
              ? "."
              : ""}
            {transactionAmount[transactionAmount.length - 1] === "0" &&
            transactionAmount.includes(".")
              ? "0"
              : ""}
          </Text>
        </View>
        <View style={styles.TransactionDetailsRow}>
          <Text style={styles.TransactionDetailName}>Category</Text>
          <Text style={styles.TransactionDetailValue}>Transport</Text>
        </View>
        <View style={styles.TransactionDetailsRow}>
          <Text style={styles.TransactionDetailName}>Account</Text>
          <Text style={styles.TransactionDetailValue}>Checking</Text>
        </View>
        <View style={styles.TransactionDetailsRow}>
          <Text style={styles.TransactionDetailName}>Note</Text>
          <Text style={styles.TransactionDetailValue}>Test</Text>
        </View>
      </View>
      {showAmountKeyboard && (
        <Keyboard
          headerText={focusedInput}
          headerBackgroundColor={colors[transactionType]}
          typeColor={colors[transactionType]}
          value={transactionAmount}
          valueUpdateFunction={setTransactionAmount}
          closeKeyboard={closeKeyboard}
        />
      )}
      {showCategoryPicker && (
        <View>
          <Text>Category Picker</Text>
          {storedCategories.map((category) => (
            <Text key={category.category_id}>
              {category.category_emoji}
              {category.category_name}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};
export default addTransaction;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#1E1E24",
  },
  typeSelector: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 40,
  },
  type: {
    color: "white",
    fontWeight: "bold",
    fontSize: 20,
    backgroundColor: "#2C2E42",
    paddingHorizontal: 15,
    borderRadius: 2,
  },
  TransactionDetails: {
    width: "90%",
    backgroundColor: "#2C2C36",
    borderRadius: 2,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 20,
    padding: 20,
  },
  TransactionDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  TransactionDetailName: {
    color: "white",
    marginRight: 20,
    marginLeft: 10,
    fontSize: 16,
    minWidth: "20%",
  },
  TransactionDetailValue: {
    color: "white",
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#d9d9d925",
    flex: 1,
    textAlign: "left",
    paddingVertical: 2,
  },
});
