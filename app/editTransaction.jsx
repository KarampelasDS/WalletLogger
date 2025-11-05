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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const EditTransaction = () => {
  const navigation = useNavigation();
  const [transactionType, setTransactionType] = useState("Expense");
  const [focusedInput, setFocusedInput] = useState(null);
  const db = Store((state) => state.db);
  const setShowNavbar = Store((state) => state.setShowNavbar);
  const router = useRouter();

  // Editing context
  const editingID = Store((state) => state.editingID);
  const setDbUpToDate = Store((state) => state.setDbUpToDate);
  const [originalTransaction, setOriginalTransaction] = useState(null);

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
  const [transactionBaseAmount, setTransactionBaseAmount] = useState("");
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

  // Currency Picking
  const [transactionCurrency, setTransactionCurrency] = useState({
    name: "",
    id: 0,
    symbol: "",
    conversion_rate_to_main: 1,
  });
  const [storedCurrencies, setStoredCurrencies] = useState();
  const mainCurrency = Store((state) => state.mainCurrency);
  const [exchangedTransaction, setExchangedTransaction] = useState(false);

  const loadCurrencies = async () => {
    if (!db) {
      console.error("Could not open DB");
      return;
    }
    const currencies = await db.getAllAsync(`
    SELECT 
      uc.currency_id, 
      uc.is_main, 
      uc.conversion_rate_to_main, 
      uc.display_order,
      c.currency_name,
      c.currency_symbol
    FROM user_currencies uc
    JOIN currencies c ON uc.currency_id = c.currency_id
    ORDER BY uc.display_order ASC
  `);
    setStoredCurrencies(currencies);
  };

  useEffect(() => {
    loadCurrencies();
  }, [db]);

  // Category Picking
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
      "SELECT * FROM categories WHERE category_type = 'Income' ORDER BY category_order ASC"
    );
    setStoredIncomeCategories(incomeCategories);

    const expenseCategories = await db.getAllAsync(
      "SELECT * FROM categories WHERE category_type = 'Expense' ORDER BY category_order ASC"
    );
    setStoredExpenseCategories(expenseCategories);
  };

  useEffect(() => {
    LoadCategories();
  }, [db]);

  useEffect(() => {
    setTransactionCategory({ name: "", id: 0, emoji: "" });
    if (transactionType === "Transfer" && exchangedTransaction) {
      setTransactionCurrency({
        name: mainCurrency.currency_name,
        id: mainCurrency.currency_id,
        symbol: mainCurrency.currency_symbol,
        conversion_rate_to_main: mainCurrency.conversion_rate_to_main,
      });
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Cannot change currency on transfer transactions",
      });
    }
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
    const accounts = await db.getAllAsync(
      "SELECT * FROM accounts ORDER BY account_order ASC"
    );
    setStoredAccounts(accounts);
  };

  useEffect(() => {
    LoadAccounts();
  }, [db]);

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

  // Note
  const [transactionNote, setTransactionNote] = useState("");

  // --- Prepopulate fields from editingID ---
  const prepopulateFields = async () => {
    if (!db || !editingID) return;
    const results = await db.getAllAsync(
      `SELECT * FROM transactions WHERE transaction_id=?`,
      [editingID]
    );
    if (!results || results.length === 0) return;
    const tx = results[0];
    setOriginalTransaction(tx);
    setTransactionType(tx.transaction_type);
    setTransactionDate(new Date(tx.transaction_date));
    setTransactionAmount(
      tx.transaction_secondCurrencyAmount != null &&
        tx.transaction_secondCurrencyAmount !== undefined
        ? String(tx.transaction_secondCurrencyAmount)
        : String(tx.transaction_amount)
    );
    setTransactionNote(tx.transaction_note || "");

    // Currency
    if (tx.currency_id) {
      const currency = await db.getAllAsync(
        `SELECT * FROM currencies WHERE currency_id=?`,
        [tx.currency_id]
      );
      if (currency.length > 0)
        setTransactionCurrency({
          id: currency[0].currency_id,
          name: currency[0].currency_name,
          symbol: currency[0].currency_symbol,
          conversion_rate_to_main: tx.exchange_rate || 1,
        });
    }

    // Category
    if (tx.category_id) {
      const category = await db.getAllAsync(
        `SELECT * FROM categories WHERE category_id=?`,
        [tx.category_id]
      );
      if (category.length > 0)
        setTransactionCategory({
          id: category[0].category_id,
          name: category[0].category_name,
          emoji: category[0].category_emoji || "",
        });
    }

    // Accounts
    if (tx.account_id) {
      const account = await db.getAllAsync(
        `SELECT * FROM accounts WHERE account_id=?`,
        [tx.account_id]
      );
      if (account.length > 0)
        setTransactionAccount({
          id: account[0].account_id,
          name: account[0].account_name,
          emoji: account[0].account_emoji || "",
        });
    }
    if (tx.account_from_id) {
      const accFrom = await db.getAllAsync(
        `SELECT * FROM accounts WHERE account_id=?`,
        [tx.account_from_id]
      );
      if (accFrom.length > 0)
        setTransactionAccountFrom({
          id: accFrom[0].account_id,
          name: accFrom[0].account_name,
          emoji: accFrom[0].account_emoji || "",
        });
    }
    if (tx.account_to_id) {
      const accTo = await db.getAllAsync(
        `SELECT * FROM accounts WHERE account_id=?`,
        [tx.account_to_id]
      );
      if (accTo.length > 0)
        setTransactionAccountTo({
          id: accTo[0].account_id,
          name: accTo[0].account_name,
          emoji: accTo[0].account_emoji || "",
        });
    }
  };

  const reverseOriginalTransaction = async () => {
    if (!originalTransaction) return;

    const type = originalTransaction.transaction_type;

    if (type === "Income") {
      // remove the income from the account
      await db.runAsync(
        `UPDATE accounts SET account_balance = ROUND(account_balance - ?,2) WHERE account_id = ?`,
        [originalTransaction.transaction_amount, originalTransaction.account_id]
      );
    } else if (type === "Expense") {
      // add the expense back to the account
      await db.runAsync(
        `UPDATE accounts SET account_balance = ROUND(account_balance + ?,2) WHERE account_id = ?`,
        [originalTransaction.transaction_amount, originalTransaction.account_id]
      );
    } else if (type === "Transfer") {
      // reverse the transfer
      await db.runAsync(
        `UPDATE accounts SET account_balance = ROUND(account_balance + ?,2) WHERE account_id = ?`,
        [
          originalTransaction.transaction_amount,
          originalTransaction.account_from_id,
        ]
      );
      await db.runAsync(
        `UPDATE accounts SET account_balance = ROUND(account_balance - ?,2) WHERE account_id = ?`,
        [
          originalTransaction.transaction_amount,
          originalTransaction.account_to_id,
        ]
      );
    }
  };

  useEffect(() => {
    prepopulateFields();
  }, [db, editingID]);

  // Transaction Submission
  const [canSubmitTransaction, setCanSubmitTransaction] = useState(false);
  const [canSubmitTransferTransaction, setCanSubmitTransferTransaction] =
    useState(false);

  const submitTransaction = async () => {
    try {
      await reverseOriginalTransaction();
      await db.runAsync(
        `UPDATE transactions SET
    transaction_type=?,
    transaction_amount=?,
    category_id=?,
    category_emoji_snapshot=?,
    category_name_snapshot=?,
    transaction_date=?,
    transaction_note=?,
    account_id=?,
    account_snapshot_emoji=?,
    account_snapshot_name=?,
    currency_id=?,
    currency_snapshot_name=?,
    currency_snapshot_symbol=?,
    converted_from_currency_id=?,
    transaction_secondCurrencyAmount=?,
    exchange_rate=?
    WHERE transaction_id=?`,
        [
          transactionType,
          exchangedTransaction
            ? parseFloat(transactionBaseAmount)
            : parseFloat(transactionAmount),
          transactionCategory.id,
          transactionCategory.emoji,
          transactionCategory.name,
          transactionDate.toISOString(),
          transactionNote,
          transactionAccount.id,
          transactionAccount.emoji,
          transactionAccount.name,
          transactionCurrency.id,
          transactionCurrency.name,
          transactionCurrency.symbol,
          mainCurrency.currency_id,
          exchangedTransaction
            ? parseFloat(transactionAmount)
            : parseFloat(transactionBaseAmount),
          exchangedTransaction
            ? transactionCurrency.conversion_rate_to_main
            : 1,
          editingID,
        ]
      );
      await db.runAsync(
        `UPDATE accounts SET account_balance = ROUND(account_balance ${
          transactionType == "Income" ? "+" : "-"
        } ?,2) WHERE account_id = ? `,
        [
          exchangedTransaction ? transactionBaseAmount : transactionAmount,
          transactionAccount.id,
        ]
      );
      Toast.show({
        type: "success",
        text1: "Transaction Updated",
        text2: "Your transaction was updated successfully.",
      });
      setDbUpToDate(false);
      router.replace("/");
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update transaction.",
      });
      console.error("Transaction update error", e);
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
    await reverseOriginalTransaction();
    try {
      await db.runAsync(
        `UPDATE transactions SET
    transaction_type=?,
    transaction_amount=?,
    transaction_date=?,
    transaction_note=?,
    account_from_id=?,
    account_from_snapshot_emoji=?,
    account_from_snapshot_name=?,
    account_to_id=?,
    account_to_snapshot_emoji=?,
    account_to_snapshot_name=?,
    currency_id=?,
    currency_snapshot_name=?,
    currency_snapshot_symbol=?
    WHERE transaction_id=?`,
        [
          transactionType,
          parseFloat(transactionAmount),
          transactionDate.toISOString(),
          transactionNote,
          transactionAccountFrom.id,
          transactionAccountFrom.emoji,
          transactionAccountFrom.name,
          transactionAccountTo.id,
          transactionAccountTo.emoji,
          transactionAccountTo.name,
          transactionCurrency.id,
          transactionCurrency.name,
          transactionCurrency.symbol,
          editingID,
        ]
      );
      await db.runAsync(
        `UPDATE accounts SET account_balance = ROUND(account_balance - ?, 2) WHERE account_id = ?`,
        [parseFloat(transactionAmount), transactionAccountFrom.id]
      );

      await db.runAsync(
        `UPDATE accounts SET account_balance = ROUND(account_balance + ?, 2) WHERE account_id = ?`,
        [parseFloat(transactionAmount), transactionAccountTo.id]
      );
      Toast.show({
        type: "success",
        text1: "Transaction Updated",
        text2: "Your transaction was updated successfully.",
      });
      setDbUpToDate(false);
      router.replace("/");
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update transaction.",
      });
      console.error("Transaction update error", e);
    }
  };

  useEffect(() => {
    setExchangedTransaction(
      transactionCurrency.id !== mainCurrency.currency_id
    );
  }, [transactionCurrency]);

  useEffect(() => {
    setTransactionBaseAmount(
      parseFloat(
        (
          transactionAmount * transactionCurrency.conversion_rate_to_main
        ).toFixed(2)
      )
    );
  }, [transactionAmount, transactionCurrency]);

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
          title="Edit Transaction"
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
          <View
            style={[styles.TransactionDetailsRow, { flexDirection: "column" }]}
          >
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
            <View>
              {transactionCurrency.id !== mainCurrency.currency_id && (
                <View style={{ marginTop: 14 }}>
                  <Text
                    style={{
                      color: "#9ac9e3",
                      fontWeight: "bold",
                      fontSize: 16,
                    }}
                  >
                    {transactionCurrency.conversion_rate_to_main
                      ? `${Number(
                          transactionAmount *
                            transactionCurrency.conversion_rate_to_main
                        ).toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })} ${mainCurrency.currency_symbol}`
                      : "Not found"}
                  </Text>
                  <Text style={{ color: "white", marginTop: 8 }}>
                    Exchange Rate ({transactionCurrency.symbol} →{" "}
                    {mainCurrency.currency_symbol})
                  </Text>
                  <Text style={{ color: "white", marginBottom: 8 }}>
                    {transactionCurrency.conversion_rate_to_main}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      marginTop: 10,
                    }}
                  >
                    <TouchableOpacity
                      style={{
                        backgroundColor: "#393B60",
                        paddingVertical: 6,
                        paddingHorizontal: 16,
                        borderRadius: 6,
                        marginRight: 4,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "#9ac9e3",
                          fontWeight: "600",
                          marginRight: 4,
                        }}
                      >
                        Refresh
                      </Text>
                      <Ionicons name="refresh" size={18} color="#9ac9e3" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        backgroundColor: "#393B60",
                        paddingVertical: 6,
                        paddingHorizontal: 16,
                        borderRadius: 6,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                      onPress={() => router.push("settings/manageCurrencies")}
                    >
                      <Text
                        style={{
                          color: "#9ac9e3",
                          fontWeight: "600",
                          marginRight: 4,
                        }}
                      >
                        Edit
                      </Text>
                      <Ionicons name="pencil" size={18} color="#9ac9e3" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
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
            allowExchange={transactionType !== "Transfer"}
          />
        )}

        {showCategoryPicker && (
          <OptionPicker
            value={transactionCategory}
            valueUpdateFunction={setTransactionCategory}
            options={
              transactionType === "Income"
                ? storedIncomeCategories
                : storedExpenseCategories
            }
            closePicker={closeCategoryPicker}
            headerText={"Category"}
            headerBackgroundColor={colors[transactionType]}
            typeColor={colors[transactionType]}
            type="Category"
          />
        )}

        {showAccountPicker && (
          <OptionPicker
            value={transactionAccount}
            valueUpdateFunction={setTransactionAccount}
            options={storedAccounts}
            closePicker={closeAccountPicker}
            headerText={"Account"}
            headerBackgroundColor={colors[transactionType]}
            typeColor={colors[transactionType]}
            type="Account"
          />
        )}

        {showAccountFromPicker && (
          <OptionPicker
            value={transactionAccountFrom}
            valueUpdateFunction={setTransactionAccountFrom}
            options={storedAccounts}
            closePicker={closeAccountFromPicker}
            headerText={"Account"}
            headerBackgroundColor={colors[transactionType]}
            typeColor={colors[transactionType]}
            type="Account"
          />
        )}

        {showAccountToPicker && (
          <OptionPicker
            value={transactionAccountTo}
            valueUpdateFunction={setTransactionAccountTo}
            options={storedAccounts}
            closePicker={closeAccountToPicker}
            headerText={"Account"}
            headerBackgroundColor={colors[transactionType]}
            typeColor={colors[transactionType]}
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
              disabledColor={"#33343fff"}
              enabled={canSubmitTransaction && transactionType !== "Transfer"}
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
              disabledColor={"#33343fff"}
              enabled={
                canSubmitTransferTransaction && transactionType === "Transfer"
              }
            >
              Save
            </Button>
          )}
          <View style={{ marginTop: 10 }}>
            <Button
              function={async () => {
                await reverseOriginalTransaction();
                try {
                  await db.runAsync(
                    `DELETE FROM transactions WHERE transaction_id=?`,
                    [editingID]
                  );
                  Toast.show({
                    type: "success",
                    text1: "Transaction Deleted",
                    text2: "Your transaction was deleted successfully.",
                  });
                  setDbUpToDate(false);
                  router.replace("/");
                } catch (e) {
                  Toast.show({
                    type: "error",
                    text1: "Error",
                    text2: "Failed to delete transaction.",
                  });
                  console.error("Transaction delete error", e);
                }
              }}
              functionDisabled={() => {
                Toast.show({
                  type: "error",
                  text1: "Error",
                  text2: "Could not delete transaction.",
                });
              }}
              backgroundColor={"#CD5D5D"}
              disabledColor={"#33343fff"}
              enabled={!!editingID}
            >
              Delete
            </Button>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default EditTransaction;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#1A1B25",
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
    backgroundColor: "#2C2E42",
    borderRadius: 14,
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
