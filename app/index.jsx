import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  Animated,
} from "react-native";
import MonthSwiper from "../components/MonthSwiper/MonthSwiper";
import EmptyState from "../components/EmptyState/EmptyState";
import TransactionsSkeleton from "../components/Skeleton/TransactionsSkeleton";
import { useState, useEffect, useRef } from "react";
import AddTransactionButton from "../components/TransactionsPage/AddTransactionButton";
import Title from "../components/Title/Title";
import { Ionicons } from "@expo/vector-icons";
import { Store } from "../stores/Store";
import TransactionDay from "../components/TransactionRecords/TransactionDay";
import { useRouter } from "expo-router";
import { fmtAmount } from "../utils/format";

// Month names for display
const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const Home = () => {
  const db = Store((state) => state.db);
  const initDB = Store((state) => state.initDB);
  const dbInitialized = Store((state) => state.dbInitialized);
  const setDbInitialized = Store((state) => state.setDbInitialized);
  const mainCurrency = Store((state) => state.mainCurrency);
  const editingID = Store((state) => state.editingID);
  const setEditingID = Store((state) => state.setEditingID);
  const historyFocusDate = Store((state) => state.historyFocusDate);

  const router = useRouter();

  const [grouped, setGrouped] = useState([]);
  const [transactions, setTransactions] = useState([]);
  // Month/year live in the store so they survive navigating into a transaction
  const shownMonth = Store((state) => state.historyMonth);
  const shownYear = Store((state) => state.historyYear);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const iconSize = Store((state) => state.iconSize);
  const [loading, setLoading] = useState(false);

  // Search state
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const searchAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef(null);

  // Scroll position restore
  const scrollRef = useRef(null);
  const didRestoreScroll = useRef(false);

  // Slide-animation direction (-1 prev, +1 next), shared with MonthSwiper
  const directionRef = useRef(0);

  // Move months. Reads/writes the store directly so the handler never goes stale.
  const shiftMonth = (delta) => {
    directionRef.current = delta > 0 ? 1 : -1;
    const s = Store.getState();
    let m = s.historyMonth + delta;
    let y = s.historyYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    s.setHistoryMonth(m);
    s.setHistoryYear(y);
  };

  // Initialize database once
  useEffect(() => {
    const init = async () => {
      if (!dbInitialized) {
        await initDB();
        setDbInitialized(true);
      }
    };
    init();
    const fetchTables = async () => {
      const transactions = await db.getAllAsync("SELECT * FROM transactions");
      console.log("Transactions:", transactions);
      const accounts = await db.getAllAsync("SELECT * FROM accounts");
      console.log("Accounts:", accounts);
    };
    fetchTables();
  }, []);

  // Fetch transactions whenever month/year or DB state changes
  useEffect(() => {
    if (!dbInitialized) return;
    // Hide the (heavy) list immediately so flicking through months never renders
    // an in-between month — only the one you settle on after the debounce renders.
    setLoading(true);
    const fetchTransactions = async () => {
      try {
        const month = String(shownMonth + 1).padStart(2, "0");
        const query = `
          SELECT
            t.transaction_id,
            t.transaction_type,
            t.transaction_amount,
            t.transaction_date,
            t.transaction_note,
            t.transaction_secondCurrencyAmount,
            af.account_name AS account_from_name,
            af.account_emoji AS account_from_emoji,
            at.account_name AS account_to_name,
            at.account_emoji AS account_to_emoji,
            a.account_name AS account_name,
            a.account_emoji AS account_emoji,
            t.account_from_snapshot_name,
            t.account_from_snapshot_emoji,
            t.account_to_snapshot_name,
            t.account_to_snapshot_emoji,
            t.account_snapshot_name,
            t.account_snapshot_emoji,
            c.category_name AS category_name,
            c.category_emoji AS category_emoji,
            t.category_name_snapshot,
            t.category_emoji_snapshot,
            cur.currency_symbol AS currency_symbol,
            t.currency_snapshot_name,
            t.currency_snapshot_symbol
          FROM transactions t
          LEFT JOIN accounts a ON t.account_id = a.account_id
          LEFT JOIN accounts af ON t.account_from_id = af.account_id
          LEFT JOIN accounts at ON t.account_to_id = at.account_id
          LEFT JOIN categories c ON t.category_id = c.category_id
          LEFT JOIN currencies cur ON t.currency_id = cur.currency_id
          WHERE strftime('%Y', t.transaction_date) = '${shownYear}'
          AND strftime('%m', t.transaction_date) = '${month}'
          ORDER BY t.transaction_date DESC
        `;
        // run the transactions read and the account-balance read concurrently
        const [data, accs] = await Promise.all([
          db.getAllAsync(query),
          db.getAllAsync("SELECT account_balance FROM accounts"),
        ]);

        const grouped = {};
        data.forEach((t) => {
          const onlyDate = t.transaction_date.slice(0, 10);
          if (!grouped[onlyDate]) grouped[onlyDate] = [];
          grouped[onlyDate].push(t);
        });

        calculateMonthlyTotals(data);
        setGrouped(grouped);
        setTransactions(data);
        setTotalBalance(accs.reduce((s, a) => s + parseFloat(a.account_balance), 0));
      } catch (err) {
        console.error("DB read error:", err);
      } finally {
        setLoading(false);
      }
    };
    // Debounced so rapidly flicking through months only fetches the one you land on
    const t = setTimeout(fetchTransactions, 180);
    return () => clearTimeout(t);
  }, [dbInitialized, shownMonth, shownYear]);

  const calculateMonthlyTotals = (data) => {
    let income = 0;
    let expenses = 0;
    if (!data || data.length === 0) {
      setMonthlyIncome(0);
      setMonthlyExpenses(0);
      return;
    }
    data.forEach((t) => {
      const amt = parseFloat(
        t.transaction_secondCurrencyAmount != null
          ? t.transaction_secondCurrencyAmount
          : t.transaction_amount
      );
      if (t.transaction_type === "Income") income += amt;
      else if (t.transaction_type === "Expense") expenses += amt;
    });
    setMonthlyIncome(income);
    setMonthlyExpenses(expenses);
  };

  const toggleSearch = () => {
    if (searchVisible) {
      Animated.timing(searchAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        setSearchVisible(false);
        setSearchText("");
      });
    } else {
      setSearchVisible(true);
      Animated.timing(searchAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        searchInputRef.current?.focus();
      });
    }
  };

  const filteredGrouped = (() => {
    if (!searchText.trim()) return grouped;
    const q = searchText.toLowerCase();
    const result = {};
    Object.keys(grouped).forEach((date) => {
      const filtered = grouped[date].filter((t) => {
        const note = (t.transaction_note || "").toLowerCase();
        const cat = (t.category_name_snapshot || t.category_name || "").toLowerCase();
        const acc = (t.account_name || t.account_snapshot_name || "").toLowerCase();
        const accFrom = (t.account_from_name || t.account_from_snapshot_name || "").toLowerCase();
        const accTo = (t.account_to_name || t.account_to_snapshot_name || "").toLowerCase();
        const amt = String(t.transaction_amount);
        return (
          note.includes(q) ||
          cat.includes(q) ||
          acc.includes(q) ||
          accFrom.includes(q) ||
          accTo.includes(q) ||
          amt.includes(q)
        );
      });
      if (filtered.length > 0) result[date] = filtered;
    });
    return result;
  })();

  // Helper: fallback to snapshot if live/joined field is null
  const fallback = (main, snapshot) =>
    main != null && main !== "" ? main : snapshot;

  // Build the per-day groups the FlatList renders (one item = one day card)
  const days = Object.keys(filteredGrouped).map((date) => {
    let dailyIncome = 0;
    let dailyExpenses = 0;
    filteredGrouped[date].forEach((t) => {
      const amt = parseFloat(
        t.transaction_secondCurrencyAmount != null
          ? t.transaction_secondCurrencyAmount
          : t.transaction_amount
      );
      if (t.transaction_type === "Income") dailyIncome += amt;
      else if (t.transaction_type === "Expense") dailyExpenses += amt;
    });
    return { date, txns: filteredGrouped[date], dailyIncome, dailyExpenses };
  });

  const renderRow = (t) => (
    <TouchableOpacity
      key={t.transaction_id}
      style={styles.txRow}
      onPress={() => {
        setEditingID(t.transaction_id);
        router.push(`/editTransaction`);
      }}
    >
      <View style={styles.txMain}>
        {t.transaction_type === "Transfer" ? (
          <>
            <Text style={styles.txLeft} numberOfLines={1}>
              {fallback(t.account_from_emoji, t.account_from_snapshot_emoji)}
              {"  "}
              {fallback(t.account_from_name, t.account_from_snapshot_name)}
            </Text>
            <Ionicons
              name="arrow-forward-outline"
              size={14}
              color="#aaa"
              style={{ marginHorizontal: 4 }}
            />
            <Text style={styles.txMid} numberOfLines={1}>
              {fallback(t.account_to_emoji, t.account_to_snapshot_emoji)}
              {"  "}
              {fallback(t.account_to_name, t.account_to_snapshot_name)}
            </Text>
            <Text style={[styles.txAmount, { color: "#734BE9" }]} numberOfLines={1}>
              {fmtAmount(t.transaction_amount)}{" "}
              {fallback(t.currency_symbol, t.currency_snapshot_symbol)}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.txLeft} numberOfLines={1}>
              {fallback(t.category_emoji, t.category_emoji_snapshot)}
              {"  "}
              {fallback(t.category_name, t.category_name_snapshot)}
            </Text>
            <Text style={styles.txMid} numberOfLines={1}>
              {fallback(t.account_emoji, t.account_snapshot_emoji)}
              {"  "}
              {fallback(t.account_name, t.account_snapshot_name)}
            </Text>
            <Text
              style={[
                styles.txAmount,
                { color: t.transaction_type === "Income" ? "#4EA758" : "#CD5D5D" },
              ]}
              numberOfLines={1}
            >
              {fmtAmount(
                t.transaction_secondCurrencyAmount != null
                  ? t.transaction_secondCurrencyAmount
                  : t.transaction_amount
              )}{" "}
              {fallback(t.currency_symbol, t.currency_snapshot_symbol)}
            </Text>
          </>
        )}
      </View>
      {t.transaction_note ? (
        <Text style={styles.txNote} numberOfLines={2}>
          {t.transaction_note}
        </Text>
      ) : null}
    </TouchableOpacity>
  );

  const renderDay = ({ item }) => (
    <TransactionDay
      date={new Date(item.date).toLocaleDateString("en-GB", { day: "2-digit" })}
      weekday={new Date(item.date).toLocaleDateString("en-GB", { weekday: "short" })}
      month={new Date(item.date).toLocaleDateString("en-GB", { month: "2-digit" })}
      year={new Date(item.date).toLocaleDateString("en-GB", { year: "2-digit" })}
      income={item.dailyIncome}
      expenses={item.dailyExpenses}
      style={{
        marginVertical: 10,
        width: "100%",
        paddingHorizontal: 20,
        alignItems: "center",
      }}
    >
      {item.txns.map(renderRow)}
    </TransactionDay>
  );

  // Scroll to a specific day when arriving from the statistics calendar
  useEffect(() => {
    if (loading || !historyFocusDate || days.length === 0) return;
    const idx = days.findIndex((d) => d.date === historyFocusDate);
    Store.getState().setHistoryFocusDate(null);
    if (idx >= 0) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollToIndex({
          index: idx,
          animated: true,
          viewPosition: 0,
        });
      });
    }
  }, [loading, historyFocusDate]);

  return (
    <View style={styles.container}>
      {dbInitialized && (
        <>
          <Title
            title={`${months[shownMonth]} ${shownYear}`}
            backIcon={"chevron-back-outline"}
            onPressBackIcon={() => shiftMonth(-1)}
            frontIcon={"chevron-forward-outline"}
            onPressFrontIcon={() => shiftMonth(1)}
            actionButton={
              <TouchableOpacity onPress={toggleSearch}>
                <Ionicons
                  name={searchVisible ? "close-outline" : "search-outline"}
                  size={iconSize}
                  color={searchVisible ? "#734BE9" : "#fff"}
                />
              </TouchableOpacity>
            }
          />
          {searchVisible && (
            <Animated.View
              style={[
                styles.searchBarContainer,
                { opacity: searchAnim, transform: [{ scaleY: searchAnim }] },
              ]}
            >
              <Ionicons name="search-outline" size={18} color="#aaa" style={{ marginRight: 8 }} />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Search transactions..."
                placeholderTextColor="#666"
                value={searchText}
                onChangeText={setSearchText}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText("")}>
                  <Ionicons name="close-circle" size={18} color="#aaa" />
                </TouchableOpacity>
              )}
            </Animated.View>
          )}
        </>
      )}
      <MonthSwiper
        style={styles.swipeArea}
        triggerKey={`${shownMonth}-${shownYear}`}
        directionRef={directionRef}
        onPrev={() => shiftMonth(-1)}
        onNext={() => shiftMonth(1)}
      >
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={[styles.summaryValue, { color: "#4EA758" }]} numberOfLines={1}>
            {fmtAmount(monthlyIncome)}{mainCurrency ? mainCurrency.currency_symbol : ""}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Expenses</Text>
          <Text style={[styles.summaryValue, { color: "#CD5D5D" }]} numberOfLines={1}>
            {fmtAmount(monthlyExpenses)}{mainCurrency ? mainCurrency.currency_symbol : ""}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Balance</Text>
          <Text
            style={[styles.summaryValue, { color: totalBalance < 0 ? "#CD5D5D" : "#4EA758" }]}
            numberOfLines={1}
          >
            {fmtAmount(totalBalance)}{mainCurrency ? mainCurrency.currency_symbol : ""}
          </Text>
        </View>
      </View>

      {loading ? (
        <TransactionsSkeleton />
      ) : (
        <FlatList
          ref={scrollRef}
          style={{ width: "100%" }}
          data={days}
          keyExtractor={(item) => item.date}
          renderItem={renderDay}
          ListEmptyComponent={
            <EmptyState
              text={
                searchText.trim()
                  ? "No transactions match your search"
                  : "No transactions this month"
              }
            />
          }
          contentContainerStyle={
            days.length === 0
              ? { flexGrow: 1, justifyContent: "center", paddingBottom: 120 }
              : { paddingBottom: 200 }
          }
          scrollEventThrottle={16}
          onScroll={(e) =>
            Store.getState().setHistoryScrollY(e.nativeEvent.contentOffset.y)
          }
          onContentSizeChange={() => {
            if (didRestoreScroll.current) return;
            const y = Store.getState().historyScrollY;
            if (y > 0) scrollRef.current?.scrollToOffset({ offset: y, animated: false });
            didRestoreScroll.current = true;
          }}
          initialNumToRender={8}
          maxToRenderPerBatch={6}
          windowSize={9}
          removeClippedSubviews
          onScrollToIndexFailed={(info) => {
            // Item not measured yet — approximate, then retry
            setTimeout(() => {
              scrollRef.current?.scrollToIndex({
                index: info.index,
                animated: true,
                viewPosition: 0,
              });
            }, 300);
          }}
        />
      )}
      </MonthSwiper>

      <AddTransactionButton />
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1B25",
    alignItems: "center",
  },
  swipeArea: {
    flex: 1,
    width: "100%",
    alignItems: "center",
  },
  searchBarContainer: {
    width: "90%",
    backgroundColor: "#2C2E42",
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
  },
  summaryCard: {
    width: "90%",
    backgroundColor: "#2C2E42",
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    marginBottom: 10,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  summaryLabel: {
    color: "#aaa",
    fontSize: 13,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "bold",
    width: "100%",
    textAlign: "center",
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: "#d9d9d930",
  },
  txRow: {
    borderTopColor: "#d9d9d910",
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  txMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  txLeft: {
    flex: 2,
    color: "#fff",
    fontSize: 14,
  },
  txMid: {
    flex: 2,
    color: "#aaa",
    fontSize: 14,
    textAlign: "center",
  },
  txAmount: {
    flex: 2,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
  },
  txNote: {
    color: "#888",
    fontSize: 12,
    marginTop: 4,
    paddingLeft: 2,
  },
});
