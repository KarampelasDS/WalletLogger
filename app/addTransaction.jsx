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
import Button from "../components/Button/Button";
import Toast from "react-native-toast-message";

const AddTransaction = () => {
  const navigation = useNavigation();
  const [transactionType, setTransactionType] = useState("Expense");
  const [focusedInput, setFocusedInput] = useState(null);
  const db = Store((state) => state.db);
  const setShowNavbar = Store((state) => state.setShowNavbar);

  //! Date Picking
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

  //! Amount Picking
  const [transactionAmount, setTransactionAmount] = useState("");
  const [showAmountKeyboard, setShowAmountKeyboard] = useState(false);

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

  //! Currency Picking
  const [transactionCurrency, setTransactionCurrency] = useState({
    name: "",
    id: 0,
    symbol: "",
  });
  const [storedCurrencies, setStoredCurrencies] = useState();

  const loadCurrencies = async () => {
    if (!db) {
      console.error("Could not open DB");
      return;
    }
    const currencies = await db.getAllAsync("SELECT * FROM currencies");
    setStoredCurrencies(currencies);
    setTransactionCurrency({
      name: currencies[0].currency_name,
      id: currencies[0].currency_id,
      symbol: currencies[0].currency_symbol,
    });
  };

  useEffect(() => {
    loadCurrencies();
  }, []);

  //! Category Picking
  const [transactionCategory, setTransactionCategory] = useState({
    name: "",
    id: 0,
    emoji: "",
  });
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [storedExpenseCategories, setStoredExpenseCategories] = useState([]);
  const [storedIncomeCategories, setStoredIncomeCategories] = useState([]);

  const LoadCategories = async () => {
    if (!db) {
      console.error("Could not open DB");
      return;
    }
    const incomeCategories = await db.getAllAsync(
      "SELECT * FROM categories WHERE category_type = 'Income'"
    );
    setStoredIncomeCategories(incomeCategories);

    const expenseCategories = await db.getAllAsync(
      "SELECT * FROM categories WHERE category_type = 'Expense'"
    );
    setStoredExpenseCategories(expenseCategories);
  };

  useEffect(() => {
    LoadCategories();
  }, []);

  useEffect(() => {
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

  //! Account Picking
  const [transactionAccount, setTransactionAccount] = useState({
    name: "",
    id: 0,
    emoji: "",
  });
  const [transactionAccountFrom, setTransactionAccountFrom] = useState({
    name: "",
    id: 0,
    emoji: "",
  });
  const [transactionAccountTo, setTransactionAccountTo] = useState({
    name: "",
    id: 0,
    emoji: "",
  });
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showAccountFromPicker, setShowAccountFromPicker] = useState(false);
  const [showAccountToPicker, setShowAccountToPicker] = useState(false);
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
  const openAccountFromPicker = () => {
    setShowAccountFromPicker(true);
    setShowNavbar(false);
    setFocusedInput("From");
  };
  const closeAccountFromPicker = () => {
    setShowAccountFromPicker(false);
    setShowNavbar(true);
    setFocusedInput(null);
  };
  const openAccountToPicker = () => {
    setShowAccountToPicker(true);
    setShowNavbar(false);
    setFocusedInput("To");
  };
  const closeAccountToPicker = () => {
    setShowAccountToPicker(false);
    setShowNavbar(true);
    setFocusedInput(null);
  };

  //! Note
  const [transactionNote, setTransactionNote] = useState("");

  //! Transaction Submission
  const [canSubmitTransaction, setCanSubmitTransaction] = useState(false);
  const [canSubmitTransferTransaction, setCanSubmitTransferTransaction] =
    useState(false);

  const setDbUpToDate = Store((state) => state.setDbUpToDate);

  const submitTransaction = async () => {
    try {
      await db.runAsync(
        `INSERT INTO transactions (
        transaction_type,
        transaction_amount,
        category_id,
        transaction_date,
        transaction_note,
        account_id,
        currency_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          transactionType,
          parseFloat(transactionAmount),
          transactionCategory.id,
          transactionDate.toISOString(),
          transactionNote,
          transactionAccount.id,
          transactionCurrency.id,
        ]
      );
      Toast.show({
        type: "success",
        text1: "Transaction Saved",
        text2: "Your transaction was added successfully.",
      });
      setDbUpToDate(false);
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to save transaction.",
      });
      console.error("Transaction insert error", e);
    }
  };

  useEffect(() => {
    if (
      transactionDate != "" &&
      transactionAmount != "" &&
      transactionCategory.id != "0" &&
      transactionAccount.id != "0"
    ) {
      setCanSubmitTransaction(true);
      return;
    }
    setCanSubmitTransaction(false);
  }, [
    transactionDate,
    transactionAmount,
    transactionCategory,
    transactionAccount,
    transactionType,
  ]);

  const submitTransferTransaction = async () => {
    try {
      await db.runAsync(
        `INSERT INTO transactions (
        transaction_type,
        transaction_amount,
        transaction_date,
        transaction_note,
        account_from_id,
        account_to_id,
        currency_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          transactionType,
          parseFloat(transactionAmount),
          transactionDate.toISOString(),
          transactionNote,
          transactionAccountFrom.id,
          transactionAccountTo.id,
          transactionCurrency.id,
        ]
      );
      Toast.show({
        type: "success",
        text1: "Transaction Saved",
        text2: "Your transaction was added successfully.",
      });
      setDbUpToDate(false);
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to save transaction.",
      });
      console.error("Transaction insert error", e);
    }
  };

  useEffect(() => {
    if (
      transactionDate != "" &&
      transactionAmount != "" &&
      transactionAccountFrom.id != "0" &&
      transactionAccountTo.id != "0" &&
      transactionAccountFrom.id != transactionAccountTo.id
    ) {
      setCanSubmitTransferTransaction(true);
      return;
    }
    setCanSubmitTransferTransaction(false);
  }, [
    transactionDate,
    transactionAmount,
    transactionAccountFrom,
    transactionAccountTo,
    transactionType,
  ]);

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
                  if (focusedInput == "Note") {
                    Keyboard.dismiss();
                  }
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
              onPress={() => {
                if (focusedInput == "Note") {
                  Keyboard.dismiss();
                }
                openKeyboard();
              }}
              style={[
                styles.TransactionDetailValue,
                focusedInput === "Amount" && {
                  borderBottomColor: colors[transactionType],
                },
              ]}
            >
              {transactionCurrency.symbol}
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
          {transactionType != "Transfer" && (
            <View style={styles.TransactionDetailsRow}>
              <Text style={styles.TransactionDetailName}>Category</Text>
              <Text
                style={[
                  styles.TransactionDetailValue,
                  focusedInput === "Category" && {
                    borderBottomColor: colors[transactionType],
                  },
                ]}
                onPress={() => {
                  if (focusedInput == "Note") {
                    Keyboard.dismiss();
                  }
                  openCategoryPicker();
                }}
              >
                {transactionCategory.emoji}
                {transactionCategory.name}
              </Text>
            </View>
          )}

          {/* Account */}
          {transactionType != "Transfer" && (
            <View style={styles.TransactionDetailsRow}>
              <Text style={styles.TransactionDetailName}>Account</Text>
              <Text
                style={[
                  styles.TransactionDetailValue,
                  focusedInput === "Account" && {
                    borderBottomColor: colors[transactionType],
                  },
                ]}
                onPress={() => {
                  if (focusedInput == "Note") {
                    Keyboard.dismiss();
                  }
                  openAccountPicker();
                }}
              >
                {transactionAccount.emoji}
                {transactionAccount.name}
              </Text>
            </View>
          )}

          {/* Account From */}
          {transactionType == "Transfer" && (
            <View style={styles.TransactionDetailsRow}>
              <Text style={styles.TransactionDetailName}>From</Text>
              <Text
                style={[
                  styles.TransactionDetailValue,
                  focusedInput === "From" && {
                    borderBottomColor: colors[transactionType],
                  },
                ]}
                onPress={() => {
                  if (focusedInput == "Note") {
                    Keyboard.dismiss();
                  }
                  openAccountFromPicker();
                }}
              >
                {transactionAccountFrom.emoji}
                {transactionAccountFrom.name}
              </Text>
            </View>
          )}

          {/* Account To */}
          {transactionType == "Transfer" && (
            <View style={styles.TransactionDetailsRow}>
              <Text style={styles.TransactionDetailName}>To</Text>
              <Text
                style={[
                  styles.TransactionDetailValue,
                  focusedInput === "To" && {
                    borderBottomColor: colors[transactionType],
                  },
                ]}
                onPress={() => {
                  if (focusedInput == "Note") {
                    Keyboard.dismiss();
                  }
                  openAccountToPicker();
                }}
              >
                {transactionAccountTo.emoji}
                {transactionAccountTo.name}
              </Text>
            </View>
          )}

          {/* Note */}
          <View style={styles.TransactionDetailsRow}>
            <Text style={styles.TransactionDetailName}>Note</Text>
            <TextInput
              onFocus={() => setFocusedInput("Note")}
              value={transactionNote}
              onChangeText={setTransactionNote}
              style={[
                styles.TransactionDetailValue,
                focusedInput === "Note" && {
                  borderBottomColor: colors[transactionType],
                },
              ]}
            />
          </View>
        </View>

        {/* Custom Keyboards / Pickers */}
        {showAmountKeyboard && (
          <KeyboardComponent
            headerText={"Amount"}
            headerBackgroundColor={colors[transactionType]}
            typeColor={colors[transactionType]}
            value={transactionAmount}
            valueUpdateFunction={setTransactionAmount}
            closeKeyboard={closeKeyboard}
            currencies={storedCurrencies}
            updateCurrency={setTransactionCurrency}
          />
        )}

        {showCategoryPicker && (
          <OptionPicker
            value={transactionCategory}
            valueUpdateFunction={setTransactionCategory}
            options={
              transactionType == "Income"
                ? storedIncomeCategories
                : storedExpenseCategories
            }
            headerText={"Category"}
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
            headerText={"Account"}
            headerBackgroundColor={colors[transactionType]}
            typeColor={colors[transactionType]}
            closePicker={closeAccountPicker}
            type="Account"
          />
        )}

        {showAccountFromPicker && (
          <OptionPicker
            value={transactionAccountFrom}
            valueUpdateFunction={setTransactionAccountFrom}
            options={storedAccounts}
            headerText={"Account"}
            headerBackgroundColor={colors[transactionType]}
            typeColor={colors[transactionType]}
            closePicker={closeAccountFromPicker}
            type="Account"
          />
        )}

        {showAccountToPicker && (
          <OptionPicker
            value={transactionAccountTo}
            valueUpdateFunction={setTransactionAccountTo}
            options={storedAccounts}
            headerText={"Account"}
            headerBackgroundColor={colors[transactionType]}
            typeColor={colors[transactionType]}
            closePicker={closeAccountToPicker}
            type="Account"
          />
        )}
        <View style={{ marginTop: "25%" }}>
          {transactionType != "Transfer" && (
            <Button
              function={() => {
                submitTransaction();
              }}
              functionDisabled={() => {
                Toast.show({
                  type: "error",
                  text1: "Error",
                  text2: "Make sure you fill in all required fields",
                });
              }}
              backgroundColor={"#2C2E42"}
              disabledColor={"#31323A"}
              enabled={canSubmitTransaction && transactionType != "Transfer"}
            >
              Save
            </Button>
          )}
          {transactionType == "Transfer" && (
            <Button
              function={() => {
                submitTransferTransaction();
              }}
              functionDisabled={() => {
                Toast.show({
                  type: "error",
                  text1: "Error",
                  text2: "Make sure you fill in all required fields",
                });
              }}
              backgroundColor={"#2C2E42"}
              disabledColor={"#31323A"}
              enabled={
                canSubmitTransferTransaction && transactionType == "Transfer"
              }
            >
              Save
            </Button>
          )}
        </View>
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
