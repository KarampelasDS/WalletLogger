import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import Title from "../components/Title/Title";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Store } from "../stores/Store";
import KeyboardComponent from "../components/Keyboard/Keyboard";
import OptionPicker from "../components/OptionPicker/OptionPicker";

const AddTransaction = () => {
  const navigation = useNavigation();
  const [transactionType, setTransactionType] = useState("Expense");
  const [focusedInput, setFocusedInput] = useState(null);
  const db = Store((state) => state.db);

  // Date Picking
  const [transactionDate, setTransactionDate] = useState(new Date());
  const [datePickerMode, setDatePickerMode] = useState("date");
  const [showDatePickerMode, setShowDatePickerMode] = useState(false);

  const onChange = (event, date) => {
    setShowDatePickerMode(false);
    if (date) setTransactionDate(date);
  };

  const showMode = (currentMode) => {
    setShowDatePickerMode(true);
    setDatePickerMode(currentMode);
  };

  const showDatepicker = () => showMode("date");
  const showTimepicker = () => showMode("time");

  // Amount Picking
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

  // Category Picking
  const [transactionCategory, setTransactionCategory] = useState({
    name: "",
    id: 0,
    emoji: "",
  });
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [storedCategories, setStoredCategories] = useState([]);

  const LoadCategories = async () => {
    if (!db) {
      console.error("Could not open DB");
      return;
    }
    const categories = await db.getAllAsync(
      "SELECT * FROM categories WHERE category_type = ?",
      [transactionType]
    );
    setStoredCategories(categories);
  };

  useEffect(() => {
    LoadCategories();
    setTransactionCategory({ name: "", id: 0, emoji: "" });
  }, [transactionType]);

  const openCategoryPicker = () => {
    setShowCategoryPicker(true);
    setShowNavbar(false);
    setFocusedInput("Category");
  };
  const closeCategoryPicker = () => {
    setShowCategoryPicker(false);
    setShowNavbar(true);
    setFocusedInput(null);
  };

  // Account Picking
  const [transactionAccount, setTransactionAccount] = useState({
    name: "",
    id: 0,
    emoji: "",
  });
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [storedAccounts, setStoredAccounts] = useState([]);

  const LoadAccounts = async () => {
    if (!db) {
      console.error("Could not open DB");
      return;
    }
    const accounts = await db.getAllAsync("SELECT * FROM accounts");
    setStoredAccounts(accounts);
  };

  useEffect(() => {
    LoadAccounts();
  }, []);

  const openAccountPicker = () => {
    setShowAccountPicker(true);
    setShowNavbar(false);
    setFocusedInput("Account");
  };
  const closeAccountPicker = () => {
    setShowAccountPicker(false);
    setShowNavbar(true);
    setFocusedInput(null);
  };

  // Note
  const [transactionNote, setTransactionNote] = useState("");

  // Colors
  const colors = {
    Income: "#4EA758",
    Expense: "#CD5D5D",
    Transfer: "#734BE9",
  };

  return (
    <TouchableWithoutFeedback
      style={{ zIndex: 1100 }}
      onPress={Keyboard.dismiss}
    >
      <View style={styles.container}>
        <Title
          title="Add Transaction"
          backIcon="arrow-back-circle-outline"
          onPressBackIcon={() => navigation.goBack()}
        />

        <View style={styles.typeSelector}>
          {["Income", "Expense", "Transfer"].map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setTransactionType(type)}
            >
              <Text
                style={[
                  styles.type,
                  transactionType === type && {
                    color: colors[type],
                    borderWidth: 1,
                    borderColor: colors[type],
                  },
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.TransactionDetails}>
          {/* Date */}
          <View style={styles.TransactionDetailsRow}>
            <Text style={styles.TransactionDetailName}>Date</Text>
            <Text
              style={[
                styles.TransactionDetailValue,
                focusedInput === "Date" && {
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
                {transactionDate.toLocaleString("en-GB", { weekday: "short" })}
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

          {/* Amount */}
          <View style={styles.TransactionDetailsRow}>
            <Text style={styles.TransactionDetailName}>Amount</Text>
            <Text
              onPress={openKeyboard}
              style={[
                styles.TransactionDetailValue,
                focusedInput === "Amount" && {
                  borderBottomColor: colors[transactionType],
                },
              ]}
            >
              {transactionAmount === "."
                ? "0."
                : Number(transactionAmount).toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
              {transactionAmount.endsWith(".") && transactionAmount !== "."
                ? "."
                : ""}
              {transactionAmount.endsWith("0") &&
              transactionAmount.includes(".")
                ? "0"
                : ""}
            </Text>
          </View>

          {/* Category */}
          <View style={styles.TransactionDetailsRow}>
            <Text style={styles.TransactionDetailName}>Category</Text>
            <Text
              style={[
                styles.TransactionDetailValue,
                focusedInput === "Category" && {
                  borderBottomColor: colors[transactionType],
                },
              ]}
              onPress={openCategoryPicker}
            >
              {transactionCategory.emoji}
              {transactionCategory.name}
            </Text>
          </View>

          {/* Account */}
          <View style={styles.TransactionDetailsRow}>
            <Text style={styles.TransactionDetailName}>Account</Text>
            <Text
              style={[
                styles.TransactionDetailValue,
                focusedInput === "Account" && {
                  borderBottomColor: colors[transactionType],
                },
              ]}
              onPress={openAccountPicker}
            >
              {transactionAccount.emoji}
              {transactionAccount.name}
            </Text>
          </View>

          {/* Note */}
          <View style={styles.TransactionDetailsRow}>
            <Text style={styles.TransactionDetailName}>Note</Text>
            <TextInput
              value={transactionNote}
              onChangeText={setTransactionNote}
              style={styles.TransactionDetailValue}
            />
          </View>
        </View>

        {/* Custom Keyboards / Pickers */}
        {showAmountKeyboard && (
          <KeyboardComponent
            headerText={focusedInput}
            headerBackgroundColor={colors[transactionType]}
            typeColor={colors[transactionType]}
            value={transactionAmount}
            valueUpdateFunction={setTransactionAmount}
            closeKeyboard={closeKeyboard}
          />
        )}

        {showCategoryPicker && (
          <OptionPicker
            value={transactionCategory}
            valueUpdateFunction={setTransactionCategory}
            options={storedCategories}
            headerText={focusedInput}
            headerBackgroundColor={colors[transactionType]}
            typeColor={colors[transactionType]}
            closePicker={closeCategoryPicker}
            type="Category"
          />
        )}

        {showAccountPicker && (
          <OptionPicker
            value={transactionAccount}
            valueUpdateFunction={setTransactionAccount}
            options={storedAccounts}
            headerText={focusedInput}
            headerBackgroundColor={colors[transactionType]}
            typeColor={colors[transactionType]}
            closePicker={closeAccountPicker}
            type="Account"
          />
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

export default AddTransaction;

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
