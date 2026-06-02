import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  TextInput,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Title from "../components/Title/Title";
import InfoTip from "../components/InfoTip/InfoTip";
import { Store } from "../stores/Store";
import { fmtAmount } from "../utils/format";
import PieChart from "../components/PieChart/PieChart";
import MonthSwiper from "../components/MonthSwiper/MonthSwiper";
import StatsSkeleton from "../components/Skeleton/StatsSkeleton";

const months = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];
const BAR_COLORS = [
  "#734BE9","#4EA758","#A78BFA","#f0a500",
  "#e96b9a","#4db8c0","#a07edc","#7ec47e","#dc9e7e","#5cc8e9",
];
const WEEKDAYS  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const ALL_TYPES = ["Income","Expense","Transfer"];

const TYPE_META = {
  Income:   { color: "#4EA758", icon: "trending-up-outline" },
  Expense:  { color: "#CD5D5D", icon: "trending-down-outline" },
  Transfer: { color: "#734BE9", icon: "swap-horizontal-outline" },
};

// Explanations shown in the ⓘ tooltips
const INFO = {
  savingsRate: "The share of your income you kept this period: (Income − Expenses) ÷ Income. Higher means you saved more.",
  transactions: "How many transactions (income, expenses and transfers) were recorded in this period and match your active filters.",
  avgDay: "Average spending per day this month — total expenses divided by the number of days in the month.",
  avgMonth: "Average spending per month this year — total expenses divided by 12.",
  netWorth: "Your all-time income minus all-time expenses, summed across every account.",
  calendar: "A day-by-day view of the month. A coloured dot marks days with activity — green = income only, red = expenses only, amber = both — with that day's net amount.",
  expenses: "How your spending splits across categories. The donut shows each category's share; the bars list exact amounts and percentages.",
  income: "How your income splits across categories, by share and exact amount.",
  monthlyTrend: "Income (green) vs expenses (red) for each month of the selected year, so you can spot trends at a glance.",
  yearlyTrend: "Income (green) vs expenses (red) for each of the last several years.",
  transfers: "Money moved between your own accounts. Transfers aren't income or expenses — this shows the total volume moved and the most common routes.",
  balances: "The current balance of each account, converted to your main currency.",
  summary: "Income and expenses for this period (in your main currency), and the Net — how much you gained or lost overall.",
};

// ── SQL helpers ──────────────────────────────────────────────────────────────
const buildFilters = (catIds, accIds) => ({
  catSQL: catIds.length > 0
    ? `AND category_id IN (${catIds.map(Number).join(",")})` : "",
  accSQL: accIds.length > 0
    ? `AND account_id IN (${accIds.map(Number).join(",")})` : "",
});

const buildSearchSQL = (text) => {
  if (!text.trim()) return "";
  const s = text.toLowerCase().replace(/'/g, "''");
  return `AND (
    LOWER(COALESCE(transaction_note,'')) LIKE '%${s}%' OR
    LOWER(COALESCE(category_name_snapshot,'')) LIKE '%${s}%' OR
    LOWER(COALESCE(account_snapshot_name,'')) LIKE '%${s}%' OR
    LOWER(COALESCE(account_from_snapshot_name,'')) LIKE '%${s}%' OR
    LOWER(COALESCE(account_to_snapshot_name,'')) LIKE '%${s}%' OR
    CAST(transaction_amount AS TEXT) LIKE '%${s}%'
  )`;
};

// transaction_type IN (...) clause; "AND 1=0" matches nothing when no type is selected
const buildTypeSQL = (types) =>
  types.length
    ? `AND transaction_type IN (${types.map((t) => `'${t}'`).join(",")})`
    : "AND 1=0";

const Statistics = () => {
  const db            = Store((s) => s.db);
  const dbInitialized = Store((s) => s.dbInitialized);
  const mainCurrency  = Store((s) => s.mainCurrency);
  const currentDate   = Store((s) => s.currentDate);
  const iconSize      = Store((s) => s.iconSize);
  const setEditingID  = Store((s) => s.setEditingID);
  const router        = useRouter();

  // ── Navigation ───────────────────────────────────────────────────────────────
  const [shownMonth, setShownMonth] = useState(new Date(currentDate).getMonth());
  const [shownYear,  setShownYear]  = useState(new Date(currentDate).getFullYear());
  const [activeTab,  setActiveTab]  = useState("month");
  const [loading,    setLoading]    = useState(false);

  // ── Applied filters (drive SQL re-fetch) ────────────────────────────────────
  // Default: ALL three types selected = no type filter active
  const [selectedTypes,      setSelectedTypes]      = useState([...ALL_TYPES]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedAccounts,   setSelectedAccounts]   = useState([]);

  // ── Search: text shown in box, appliedSearch drives SQL after debounce ───────
  const [searchText,    setSearchText]    = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const searchTimeout = useRef(null);

  const onSearchChange = (text) => {
    setSearchText(text);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setAppliedSearch(text), 400);
  };

  // ── Pending filter state (committed on Apply) ────────────────────────────────
  const [filterVisible,     setFilterVisible]     = useState(false);
  const [pendingTypes,      setPendingTypes]      = useState([...ALL_TYPES]);
  const [pendingCategories, setPendingCategories] = useState([]);
  const [pendingAccounts,   setPendingAccounts]   = useState([]);

  // ── Filter option lists ──────────────────────────────────────────────────────
  const [allCategories, setAllCategories] = useState([]);
  const [allAccounts,   setAllAccounts]   = useState([]);

  // ── Month data ───────────────────────────────────────────────────────────────
  const [totalIncome,       setTotalIncome]       = useState(0);
  const [totalExpense,      setTotalExpense]       = useState(0);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [incomeCategories,  setIncomeCategories]  = useState([]);
  const [calendarData,      setCalendarData]      = useState({});
  const [monthCount,        setMonthCount]        = useState(0);
  const [monthBiggest,      setMonthBiggest]      = useState(null);

  // ── Year data ────────────────────────────────────────────────────────────────
  const [yearIncome,      setYearIncome]      = useState(0);
  const [yearExpense,     setYearExpense]      = useState(0);
  const [monthlyTrend,    setMonthlyTrend]    = useState([]);
  const [yearExpenseCats, setYearExpenseCats] = useState([]);
  const [yearIncomeCats,  setYearIncomeCats]  = useState([]);
  const [yearCount,       setYearCount]       = useState(0);
  const [yearBiggest,     setYearBiggest]     = useState(null);

  // ── All-time data ────────────────────────────────────────────────────────────
  const [allIncome,      setAllIncome]      = useState(0);
  const [allExpense,     setAllExpense]      = useState(0);
  const [allExpenseCats, setAllExpenseCats]  = useState([]);
  const [allIncomeCats,  setAllIncomeCats]   = useState([]);
  const [yearlyTrend,    setYearlyTrend]     = useState([]);
  const [accounts,       setAccounts]        = useState([]);
  const [allCount,       setAllCount]        = useState(0);
  const [allBiggest,     setAllBiggest]      = useState(null);

  // ── Transfers (shared across tabs — only one tab renders at a time) ──────────
  const [transferTotal,  setTransferTotal]  = useState(0);
  const [transferCount,  setTransferCount]  = useState(0);
  const [transferRoutes, setTransferRoutes] = useState([]);

  // ── Live search results (actual matching transactions) ──────────────────────
  const [searchResults, setSearchResults] = useState([]);

  const sym = mainCurrency ? mainCurrency.currency_symbol : "";

  // hasFilter: true when anything differs from the "no filter" defaults
  const hasFilter =
    selectedTypes.length < ALL_TYPES.length ||
    selectedCategories.length > 0 ||
    selectedAccounts.length > 0 ||
    appliedSearch.trim().length > 0;

  // ── Load filter options ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!dbInitialized || !db) return;
    (async () => {
      try {
        const [cats, accs] = await Promise.all([
          db.getAllAsync(
            "SELECT category_id, category_name, category_emoji, category_type FROM categories ORDER BY category_order ASC"
          ),
          db.getAllAsync("SELECT * FROM accounts ORDER BY account_order ASC"),
        ]);
        setAllCategories(cats);
        setAllAccounts(accs);
      } catch (e) {
        console.error("loadFilterOptions:", e);
      }
    })();
  }, [dbInitialized]);

  // ── Main fetch — all filter SQL built HERE so there is no stale-closure risk ─
  useEffect(() => {
    if (!dbInitialized || !db) return;
    const { catSQL, accSQL } = buildFilters(selectedCategories, selectedAccounts);
    const srchSQL = buildSearchSQL(appliedSearch);
    const types   = selectedTypes;
    const typeSQL = buildTypeSQL(types);

    // Transfers use account_from_id / account_to_id (not account_id) and have no
    // category, so they need their own account clause and are excluded entirely
    // when a category filter is active.
    const transferAccSQL = selectedAccounts.length > 0
      ? `AND (account_from_id IN (${selectedAccounts.map(Number).join(",")}) OR account_to_id IN (${selectedAccounts.map(Number).join(",")}))`
      : "";
    const transferAllowed =
      selectedTypes.includes("Transfer") && selectedCategories.length === 0;

    // period (date) clause for the active tab — built once and threaded everywhere
    let periodSQL = "";
    if (activeTab === "month") {
      const m = String(shownMonth + 1).padStart(2, "0");
      periodSQL = `AND strftime('%Y',transaction_date)='${shownYear}' AND strftime('%m',transaction_date)='${m}'`;
    } else if (activeTab === "year") {
      periodSQL = `AND strftime('%Y',transaction_date)='${shownYear}'`;
    }

    const args = { periodSQL, typeSQL, catSQL, accSQL, srchSQL, types, transferAllowed, transferAccSQL };
    // Hide content immediately, then fetch after the debounce — flicking through
    // months/years never renders an in-between period.
    setLoading(true);
    const t = setTimeout(() => {
      loadSearchResults(periodSQL, typeSQL, srchSQL);
      if (activeTab === "month")     fetchMonthStats(args);
      else if (activeTab === "year") fetchYearStats(args);
      else                           fetchAllTimeStats(args);
    }, 180);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbInitialized, shownMonth, shownYear, activeTab,
      selectedCategories, selectedAccounts, selectedTypes, appliedSearch]);

  // ─── Fetch functions ──────────────────────────────────────────────────────────

  const amtExpr = "COALESCE(transaction_secondCurrencyAmount, transaction_amount)";

  // Live search results — actual matching transactions for the current period + types
  const loadSearchResults = async (periodSQL, typeSQL, srchSQL) => {
    if (!srchSQL) {
      setSearchResults([]);
      return;
    }
    try {
      const rows = await db.getAllAsync(
        `SELECT transaction_id, transaction_type, transaction_date,
                ${amtExpr} as amt, transaction_amount, currency_snapshot_symbol,
                category_emoji_snapshot, category_name_snapshot,
                account_snapshot_emoji, account_snapshot_name,
                account_from_snapshot_emoji, account_from_snapshot_name,
                account_to_snapshot_emoji, account_to_snapshot_name,
                transaction_note
         FROM transactions
         WHERE 1=1 ${periodSQL} ${typeSQL} ${srchSQL}
         ORDER BY transaction_date DESC LIMIT 50`
      );
      setSearchResults(rows);
    } catch (e) {
      console.error("loadSearchResults:", e);
    }
  };

  // Shared transfer loader — `periodSQL` is the date clause for the active tab ("" = all time)
  const loadTransfers = async (periodSQL, allowed, transferAccSQL, srchSQL) => {
    if (!allowed) {
      setTransferTotal(0);
      setTransferCount(0);
      setTransferRoutes([]);
      return;
    }
    try {
      const where = `WHERE transaction_type='Transfer' ${periodSQL} ${transferAccSQL} ${srchSQL}`;
      const [agg, routes] = await Promise.all([
        db.getFirstAsync(`SELECT COALESCE(SUM(${amtExpr}),0) as total, COUNT(*) as cnt FROM transactions ${where}`),
        db.getAllAsync(
          `SELECT account_from_snapshot_name as fromName, account_from_snapshot_emoji as fromEmoji,
                  account_to_snapshot_name as toName, account_to_snapshot_emoji as toEmoji,
                  SUM(${amtExpr}) as total, COUNT(*) as cnt
           FROM transactions ${where}
           GROUP BY fromName, toName ORDER BY total DESC LIMIT 8`
        ),
      ]);
      setTransferTotal(agg?.total || 0);
      setTransferCount(agg?.cnt || 0);
      setTransferRoutes(routes);
    } catch (e) {
      console.error("loadTransfers:", e);
    }
  };

  const fetchMonthStats = async ({ periodSQL, typeSQL, catSQL, accSQL, srchSQL, types, transferAllowed, transferAccSQL }) => {
    setLoading(true);
    try {
      loadTransfers(periodSQL, transferAllowed, transferAccSQL, srchSQL);
      const doInc = types.includes("Income");
      const doExp = types.includes("Expense");

      const [inc, exp, expCats, incCats, calRows, cnt, biggest] = await Promise.all([
        doInc
          ? db.getFirstAsync(`SELECT COALESCE(SUM(${amtExpr}),0) as total FROM transactions WHERE transaction_type='Income' ${periodSQL} ${catSQL} ${accSQL} ${srchSQL}`)
          : Promise.resolve({ total: 0 }),
        doExp
          ? db.getFirstAsync(`SELECT COALESCE(SUM(${amtExpr}),0) as total FROM transactions WHERE transaction_type='Expense' ${periodSQL} ${catSQL} ${accSQL} ${srchSQL}`)
          : Promise.resolve({ total: 0 }),
        doExp
          ? db.getAllAsync(`SELECT category_name_snapshot, category_emoji_snapshot, SUM(${amtExpr}) as total FROM transactions WHERE transaction_type='Expense' ${periodSQL} ${catSQL} ${accSQL} ${srchSQL} GROUP BY category_id, category_name_snapshot ORDER BY total DESC`)
          : Promise.resolve([]),
        doInc
          ? db.getAllAsync(`SELECT category_name_snapshot, category_emoji_snapshot, SUM(${amtExpr}) as total FROM transactions WHERE transaction_type='Income' ${periodSQL} ${catSQL} ${accSQL} ${srchSQL} GROUP BY category_id, category_name_snapshot ORDER BY total DESC`)
          : Promise.resolve([]),
        // Calendar always shows Income/Expense (Transfer has no meaningful income/expense value)
        db.getAllAsync(
          `SELECT CAST(strftime('%d',transaction_date) AS INTEGER) as day,
           SUM(CASE WHEN transaction_type='Income' THEN ${amtExpr} ELSE 0 END) as income,
           SUM(CASE WHEN transaction_type='Expense' THEN ${amtExpr} ELSE 0 END) as expense
           FROM transactions
           WHERE transaction_type IN ('Income','Expense') ${periodSQL} ${catSQL} ${accSQL} ${srchSQL}
           GROUP BY day ORDER BY day`
        ),
        db.getFirstAsync(`SELECT COUNT(*) as cnt FROM transactions WHERE 1=1 ${periodSQL} ${typeSQL} ${catSQL} ${accSQL} ${srchSQL}`),
        doExp
          ? db.getFirstAsync(`SELECT category_name_snapshot, category_emoji_snapshot, ${amtExpr} as amt FROM transactions WHERE transaction_type='Expense' ${periodSQL} ${catSQL} ${accSQL} ${srchSQL} ORDER BY amt DESC LIMIT 1`)
          : Promise.resolve(null),
      ]);

      setTotalIncome(inc?.total || 0);
      setTotalExpense(exp?.total || 0);
      setExpenseCategories(expCats);
      setIncomeCategories(incCats);
      setMonthCount(cnt?.cnt || 0);
      setMonthBiggest(biggest || null);
      const map = {};
      calRows.forEach((r) => { map[r.day] = r; });
      setCalendarData(map);
    } catch (e) {
      console.error("fetchMonthStats:", e);
    } finally { setLoading(false); }
  };

  const fetchYearStats = async ({ periodSQL, typeSQL, catSQL, accSQL, srchSQL, types, transferAllowed, transferAccSQL }) => {
    setLoading(true);
    try {
      loadTransfers(periodSQL, transferAllowed, transferAccSQL, srchSQL);
      const doInc = types.includes("Income");
      const doExp = types.includes("Expense");

      const [inc, exp, trend, expCats, incCats, cnt, biggest] = await Promise.all([
        doInc
          ? db.getFirstAsync(`SELECT COALESCE(SUM(${amtExpr}),0) as total FROM transactions WHERE transaction_type='Income' ${periodSQL} ${catSQL} ${accSQL} ${srchSQL}`)
          : Promise.resolve({ total: 0 }),
        doExp
          ? db.getFirstAsync(`SELECT COALESCE(SUM(${amtExpr}),0) as total FROM transactions WHERE transaction_type='Expense' ${periodSQL} ${catSQL} ${accSQL} ${srchSQL}`)
          : Promise.resolve({ total: 0 }),
        db.getAllAsync(
          `SELECT strftime('%m',transaction_date) as month,
           SUM(CASE WHEN transaction_type='Income' THEN ${amtExpr} ELSE 0 END) as income,
           SUM(CASE WHEN transaction_type='Expense' THEN ${amtExpr} ELSE 0 END) as expense
           FROM transactions WHERE 1=1 ${periodSQL} ${typeSQL} ${catSQL} ${accSQL} ${srchSQL}
           GROUP BY month ORDER BY month`
        ),
        doExp
          ? db.getAllAsync(`SELECT category_name_snapshot, category_emoji_snapshot, SUM(${amtExpr}) as total FROM transactions WHERE transaction_type='Expense' ${periodSQL} ${catSQL} ${accSQL} ${srchSQL} GROUP BY category_id, category_name_snapshot ORDER BY total DESC LIMIT 10`)
          : Promise.resolve([]),
        doInc
          ? db.getAllAsync(`SELECT category_name_snapshot, category_emoji_snapshot, SUM(${amtExpr}) as total FROM transactions WHERE transaction_type='Income' ${periodSQL} ${catSQL} ${accSQL} ${srchSQL} GROUP BY category_id, category_name_snapshot ORDER BY total DESC LIMIT 10`)
          : Promise.resolve([]),
        db.getFirstAsync(`SELECT COUNT(*) as cnt FROM transactions WHERE 1=1 ${periodSQL} ${typeSQL} ${catSQL} ${accSQL} ${srchSQL}`),
        doExp
          ? db.getFirstAsync(`SELECT category_name_snapshot, category_emoji_snapshot, ${amtExpr} as amt FROM transactions WHERE transaction_type='Expense' ${periodSQL} ${catSQL} ${accSQL} ${srchSQL} ORDER BY amt DESC LIMIT 1`)
          : Promise.resolve(null),
      ]);

      setYearIncome(inc?.total || 0);
      setYearExpense(exp?.total || 0);
      setMonthlyTrend(trend);
      setYearExpenseCats(expCats);
      setYearIncomeCats(incCats);
      setYearCount(cnt?.cnt || 0);
      setYearBiggest(biggest || null);
    } catch (e) {
      console.error("fetchYearStats:", e);
    } finally { setLoading(false); }
  };

  const fetchAllTimeStats = async ({ periodSQL, typeSQL, catSQL, accSQL, srchSQL, types, transferAllowed, transferAccSQL }) => {
    setLoading(true);
    try {
      const doInc = types.includes("Income");
      const doExp = types.includes("Expense");
      loadTransfers(periodSQL, transferAllowed, transferAccSQL, srchSQL);

      const [inc, exp, expCats, incCats, yt, accs, cnt, biggest] = await Promise.all([
        doInc
          ? db.getFirstAsync(`SELECT COALESCE(SUM(${amtExpr}),0) as total FROM transactions WHERE transaction_type='Income' ${catSQL} ${accSQL} ${srchSQL}`)
          : Promise.resolve({ total: 0 }),
        doExp
          ? db.getFirstAsync(`SELECT COALESCE(SUM(${amtExpr}),0) as total FROM transactions WHERE transaction_type='Expense' ${catSQL} ${accSQL} ${srchSQL}`)
          : Promise.resolve({ total: 0 }),
        doExp
          ? db.getAllAsync(`SELECT category_name_snapshot, category_emoji_snapshot, SUM(${amtExpr}) as total FROM transactions WHERE transaction_type='Expense' ${catSQL} ${accSQL} ${srchSQL} GROUP BY category_id, category_name_snapshot ORDER BY total DESC LIMIT 10`)
          : Promise.resolve([]),
        doInc
          ? db.getAllAsync(`SELECT category_name_snapshot, category_emoji_snapshot, SUM(${amtExpr}) as total FROM transactions WHERE transaction_type='Income' ${catSQL} ${accSQL} ${srchSQL} GROUP BY category_id, category_name_snapshot ORDER BY total DESC LIMIT 10`)
          : Promise.resolve([]),
        db.getAllAsync(
          `SELECT strftime('%Y',transaction_date) as year,
           SUM(CASE WHEN transaction_type='Income' THEN ${amtExpr} ELSE 0 END) as income,
           SUM(CASE WHEN transaction_type='Expense' THEN ${amtExpr} ELSE 0 END) as expense
           FROM transactions WHERE 1=1 ${typeSQL} ${catSQL} ${accSQL} ${srchSQL}
           GROUP BY year ORDER BY year DESC LIMIT 7`
        ),
        db.getAllAsync("SELECT * FROM accounts ORDER BY account_order ASC"),
        db.getFirstAsync(`SELECT COUNT(*) as cnt FROM transactions WHERE 1=1 ${typeSQL} ${catSQL} ${accSQL} ${srchSQL}`),
        doExp
          ? db.getFirstAsync(`SELECT category_name_snapshot, category_emoji_snapshot, ${amtExpr} as amt FROM transactions WHERE transaction_type='Expense' ${catSQL} ${accSQL} ${srchSQL} ORDER BY amt DESC LIMIT 1`)
          : Promise.resolve(null),
      ]);

      setAllIncome(inc?.total || 0);
      setAllExpense(exp?.total || 0);
      setAllExpenseCats(expCats);
      setAllIncomeCats(incCats);
      setYearlyTrend(yt.reverse());
      setAccounts(accs);
      setAllCount(cnt?.cnt || 0);
      setAllBiggest(biggest || null);
    } catch (e) {
      console.error("fetchAllTimeStats:", e);
    } finally { setLoading(false); }
  };

  // ─── Filter modal handlers ────────────────────────────────────────────────────

  const openFilter = () => {
    setPendingTypes([...selectedTypes]);
    setPendingCategories([...selectedCategories]);
    setPendingAccounts([...selectedAccounts]);
    setFilterVisible(true);
  };

  const applyFilter = () => {
    setSelectedTypes([...pendingTypes]);
    setSelectedCategories([...pendingCategories]);
    setSelectedAccounts([...pendingAccounts]);
    setFilterVisible(false);
  };

  // Reset pending to "no filter" state (all types, no category/account)
  const clearPending = () => {
    setPendingTypes([...ALL_TYPES]);
    setPendingCategories([]);
    setPendingAccounts([]);
  };

  const togglePendingType = (type) =>
    setPendingTypes((prev) =>
      // Always keep at least 1 type selected
      prev.includes(type)
        ? prev.length > 1 ? prev.filter((t) => t !== type) : prev
        : [...prev, type]
    );

  const togglePendingCategory = (id) =>
    setPendingCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );

  const togglePendingAccount = (id) =>
    setPendingAccounts((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );

  // ─── Navigation ───────────────────────────────────────────────────────────────

  // Slide-animation direction (-1 prev, +1 next), shared with MonthSwiper
  const directionRef = useRef(0);

  const goBack = () => {
    if (activeTab === "alltime") return;
    directionRef.current = -1;
    if (activeTab === "month") {
      if (shownMonth === 0) { setShownYear((y) => y - 1); setShownMonth(11); }
      else setShownMonth((m) => m - 1);
    } else if (activeTab === "year") setShownYear((y) => y - 1);
  };

  const goForward = () => {
    if (activeTab === "alltime") return;
    directionRef.current = 1;
    if (activeTab === "month") {
      if (shownMonth === 11) { setShownYear((y) => y + 1); setShownMonth(0); }
      else setShownMonth((m) => m + 1);
    } else if (activeTab === "year") setShownYear((y) => y + 1);
  };

  const titleText =
    activeTab === "alltime" ? "All Time"
    : activeTab === "year"  ? String(shownYear)
    : `${months[shownMonth]} ${shownYear}`;

  // ─── Render helpers ───────────────────────────────────────────────────────────

  const renderSummaryCard = (income, expense) => {
    const net = income - expense;
    return (
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={[styles.summaryValue, { color: "#4EA758" }]} numberOfLines={1}>
            {fmtAmount(income)}{sym}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Expenses</Text>
          <Text style={[styles.summaryValue, { color: "#CD5D5D" }]} numberOfLines={1}>
            {fmtAmount(expense)}{sym}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Net</Text>
          <Text
            style={[styles.summaryValue, { color: net >= 0 ? "#4EA758" : "#CD5D5D" }]}
            numberOfLines={1}
          >
            {fmtAmount(net)}{sym}
          </Text>
        </View>
      </View>
    );
  };

  const renderTransfers = () => {
    // Hide entirely unless Transfer is selected and there is transfer activity
    if (!selectedTypes.includes("Transfer") || transferCount === 0) return null;
    return (
      <>
        <SectionTitle title="Transfers" info={INFO.transfers} />
        <View style={styles.card}>
          <View style={styles.transferHeader}>
            <View style={styles.transferStat}>
              <Text style={[styles.transferStatValue, { color: "#734BE9" }]} numberOfLines={1}>
                {fmtAmount(transferTotal)}{sym}
              </Text>
              <Text style={styles.transferStatLabel}>Volume moved</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.transferStat}>
              <Text style={[styles.transferStatValue, { color: "#fff" }]} numberOfLines={1}>
                {transferCount}
              </Text>
              <Text style={styles.transferStatLabel}>Transfers</Text>
            </View>
          </View>
          <View style={{ marginTop: 6 }}>
            {transferRoutes.map((r, i) => (
              <View
                key={i}
                style={[styles.transferRow, i < transferRoutes.length - 1 && styles.accountRowBorder]}
              >
                <Text style={styles.transferRoute} numberOfLines={1}>
                  {r.fromEmoji || ""} {r.fromName || "?"}
                  {"  →  "}
                  {r.toEmoji || ""} {r.toName || "?"}
                  {r.cnt > 1 ? `   ×${r.cnt}` : ""}
                </Text>
                <Text style={styles.transferAmt} numberOfLines={1}>
                  {fmtAmount(r.total)}{sym}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </>
    );
  };

  const renderSearchResults = () => {
    const scope =
      activeTab === "month" ? `${months[shownMonth]} ${shownYear}`
      : activeTab === "year" ? shownYear
      : "all time";
    return (
      <>
        <Text style={styles.sectionTitle}>
          Results · {searchResults.length}{searchResults.length === 50 ? "+" : ""}
        </Text>
        <View style={styles.card}>
          {searchResults.length === 0 ? (
            <Text style={styles.emptyText}>
              No transactions match "{appliedSearch}" in {scope}
            </Text>
          ) : (
            searchResults.map((t, i) => {
              const isTransfer = t.transaction_type === "Transfer";
              const color =
                t.transaction_type === "Income" ? "#4EA758"
                : t.transaction_type === "Expense" ? "#CD5D5D"
                : "#734BE9";
              const left = isTransfer
                ? `${t.account_from_snapshot_emoji || ""} ${t.account_from_snapshot_name || "?"}  →  ${t.account_to_snapshot_emoji || ""} ${t.account_to_snapshot_name || "?"}`
                : `${t.category_emoji_snapshot || ""} ${t.category_name_snapshot || "Uncategorized"}`;
              const dateStr = new Date(t.transaction_date).toLocaleDateString("en-GB", {
                day: "2-digit", month: "short",
              });
              const sub = [
                dateStr,
                !isTransfer && t.account_snapshot_name ? t.account_snapshot_name : null,
                t.transaction_note || null,
              ].filter(Boolean).join("  ·  ");
              return (
                <TouchableOpacity
                  key={t.transaction_id}
                  style={[styles.resultRow, i < searchResults.length - 1 && styles.accountRowBorder]}
                  onPress={() => { setEditingID(t.transaction_id); router.push("/editTransaction"); }}
                >
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.resultTitle} numberOfLines={1}>{left}</Text>
                    <Text style={styles.resultSub} numberOfLines={1}>{sub}</Text>
                  </View>
                  <Text style={[styles.resultAmt, { color }]} numberOfLines={1}>
                    {fmtAmount(isTransfer ? t.transaction_amount : t.amt)}{sym}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </>
    );
  };

  const renderBars = (cats, total, emptyMsg) => {
    if (!cats.length)
      return <Text style={styles.emptyText}>{emptyMsg || "No data"}</Text>;
    return cats.map((cat, i) => {
      const pct = total > 0 ? (cat.total / total) * 100 : 0;
      return (
        <View key={i} style={styles.barRow}>
          <View style={styles.barLabelRow}>
            <Text style={styles.barLabel} numberOfLines={1}>
              {cat.category_emoji_snapshot}{"  "}{cat.category_name_snapshot || "Unknown"}
            </Text>
            <Text style={styles.barAmount}>
              {fmtAmount(cat.total)}{sym}{"  "}{pct.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.barTrack}>
            <View
              style={[styles.barFill, { width: `${pct}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }]}
            />
          </View>
        </View>
      );
    });
  };

  // ── Donut chart with centre total + legend ──────────────────────────────────
  const renderDonut = (cats, total, centerLabel, emptyMsg) => {
    if (!cats.length || total <= 0)
      return <Text style={styles.emptyText}>{emptyMsg || "No data"}</Text>;

    const slices = cats.map((c, i) => ({
      value: c.total,
      color: BAR_COLORS[i % BAR_COLORS.length],
      label: c.category_name_snapshot || "Unknown",
      emoji: c.category_emoji_snapshot || "",
    }));

    return (
      <View style={styles.donutWrap}>
        <PieChart data={slices} size={150} holeRatio={0.62} holeColor="#2C2E42">
          <Text style={styles.donutCenterLabel}>{centerLabel}</Text>
          <Text style={styles.donutCenterValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
            {fmtAmount(total)}{sym}
          </Text>
        </PieChart>

        <View style={styles.donutLegend}>
          {slices.map((s, i) => {
            const pct = total > 0 ? (s.value / total) * 100 : 0;
            return (
              <View key={i} style={styles.donutLegendRow}>
                <View style={[styles.donutLegendDot, { backgroundColor: s.color }]} />
                <Text style={styles.donutLegendLabel} numberOfLines={1}>
                  {s.emoji} {s.label}
                </Text>
                <Text style={styles.donutLegendPct}>{pct.toFixed(0)}%</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // ── KPI / insight cards row ──────────────────────────────────────────────────
  const renderKpiRow = (items) => (
    <View style={styles.kpiRow}>
      {items.map((it, i) => {
        const card = (
          <>
            <Ionicons name={it.icon} size={18} color={it.color} />
            <Text style={[styles.kpiValue, { color: it.color }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
              {it.value}
            </Text>
            <Text style={styles.kpiLabel} numberOfLines={1}>{it.label}</Text>
          </>
        );
        return it.info ? (
          <InfoTip key={i} title={it.label} text={it.info} style={styles.kpiCard} layout="corner" badgeSize={15}>
            {card}
          </InfoTip>
        ) : (
          <View key={i} style={styles.kpiCard}>{card}</View>
        );
      })}
    </View>
  );

  // Section title — the whole row is tappable when it carries a tooltip
  const SectionTitle = ({ title, info }) =>
    info ? (
      <InfoTip title={title} text={info} style={styles.sectionTitleRow} layout="inline">
        <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>{title}</Text>
      </InfoTip>
    ) : (
      <View style={styles.sectionTitleRow}>
        <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>{title}</Text>
      </View>
    );

  // savings rate %, biggest expense label, avg helper
  const savingsRate = (income, expense) => {
    if (income <= 0) return expense > 0 ? "—" : "0%";
    return `${Math.round(((income - expense) / income) * 100)}%`;
  };
  const biggestLabel = (b) =>
    b ? `${b.category_emoji_snapshot || ""} ${fmtAmount(b.amt)}${sym}` : "—";

  const BAR_H = 80;

  const renderCalendar = () => {
    const firstDay    = new Date(shownYear, shownMonth, 1).getDay();
    const daysInMonth = new Date(shownYear, shownMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    return (
      <View style={styles.card}>
        <View style={styles.calWeekRow}>
          {WEEKDAYS.map((wd) => <Text key={wd} style={styles.calWeekDay}>{wd}</Text>)}
        </View>
        {Array.from({ length: cells.length / 7 }).map((_, wi) => (
          <View key={wi} style={styles.calRow}>
            {cells.slice(wi * 7, wi * 7 + 7).map((day, di) => {
              if (!day) return <View key={di} style={styles.calCell} />;
              const d = calendarData[day];
              // Only show a dot if the day actually has income or expense
              const hasActivity = d && (d.income > 0 || d.expense > 0);
              let dotColor = null;
              if (hasActivity) {
                if (d.expense > 0 && d.income > 0) dotColor = "#f0a500";
                else if (d.expense > 0) dotColor = "#CD5D5D";
                else dotColor = "#4EA758";
              }
              const net = d ? d.income - d.expense : 0;
              return (
                <View key={di} style={styles.calCell}>
                  <Text style={styles.calDayNum}>{day}</Text>
                  {dotColor && <View style={[styles.calDot, { backgroundColor: dotColor }]} />}
                  {hasActivity && (
                    <Text
                      style={[styles.calAmount, { color: net >= 0 ? "#4EA758" : "#CD5D5D" }]}
                      numberOfLines={1}
                    >
                      {fmtAmount(Math.abs(net))}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        ))}
        <View style={styles.calLegend}>
          {[
            { color: "#4EA758", label: "Income" },
            { color: "#CD5D5D", label: "Expense" },
            { color: "#f0a500", label: "Both" },
          ].map((l) => (
            <View key={l.label} style={styles.calLegendItem}>
              <View style={[styles.calDot, { backgroundColor: l.color }]} />
              <Text style={styles.calLegendText}>{l.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderMonthlyTrend = () => {
    const maxVal = Math.max(
      ...Array.from({ length: 12 }, (_, i) => {
        const m = String(i + 1).padStart(2, "0");
        const t = monthlyTrend.find((r) => r.month === m) || { income: 0, expense: 0 };
        return Math.max(t.income, t.expense);
      }),
      1
    );
    return (
      <View style={styles.trendContainer}>
        {Array.from({ length: 12 }, (_, i) => {
          const m = String(i + 1).padStart(2, "0");
          const t = monthlyTrend.find((r) => r.month === m) || { income: 0, expense: 0 };
          const incH = (t.income / maxVal) * BAR_H;
          const expH = (t.expense / maxVal) * BAR_H;
          return (
            <View key={i} style={styles.trendCol}>
              <View style={{ height: BAR_H, flexDirection: "row", alignItems: "flex-end", gap: 1 }}>
                <View style={[styles.trendBarIncome,  { height: Math.max(incH, t.income  > 0 ? 2 : 0) }]} />
                <View style={[styles.trendBarExpense, { height: Math.max(expH, t.expense > 0 ? 2 : 0) }]} />
              </View>
              <Text style={styles.trendLabel}>{months[i]}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderYearlyTrend = () => {
    if (!yearlyTrend.length) return <Text style={styles.emptyText}>No data yet</Text>;
    const maxVal = Math.max(...yearlyTrend.map((t) => Math.max(t.income, t.expense)), 1);
    return (
      <View style={styles.trendContainer}>
        {yearlyTrend.map((t, i) => {
          const incH = (t.income / maxVal) * BAR_H;
          const expH = (t.expense / maxVal) * BAR_H;
          return (
            <View key={i} style={styles.trendCol}>
              <View style={{ height: BAR_H, flexDirection: "row", alignItems: "flex-end", gap: 1 }}>
                <View style={[styles.trendBarIncome,  { height: Math.max(incH, t.income  > 0 ? 2 : 0) }]} />
                <View style={[styles.trendBarExpense, { height: Math.max(expH, t.expense > 0 ? 2 : 0) }]} />
              </View>
              <Text style={styles.trendLabel}>{t.year}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const trendLegend = (
    <View style={styles.trendLegend}>
      {[{ color: "#4EA758", label: "Income" }, { color: "#CD5D5D", label: "Expenses" }].map((l) => (
        <View key={l.label} style={styles.calLegendItem}>
          <View style={[styles.calDot, { backgroundColor: l.color }]} />
          <Text style={styles.calLegendText}>{l.label}</Text>
        </View>
      ))}
    </View>
  );

  // ─── Tab content ──────────────────────────────────────────────────────────────

  const renderMonthTab = () => {
    const daysInMonth = new Date(shownYear, shownMonth + 1, 0).getDate();
    return (
      <>
        {renderSummaryCard(totalIncome, totalExpense)}
        {renderKpiRow([
          { label: "Savings Rate", value: savingsRate(totalIncome, totalExpense), color: "#4EA758", icon: "wallet-outline", info: INFO.savingsRate },
          { label: "Transactions", value: String(monthCount), color: "#A78BFA", icon: "receipt-outline", info: INFO.transactions },
          { label: "Avg / Day", value: `${fmtAmount(totalExpense / daysInMonth)}${sym}`, color: "#f0a500", icon: "calendar-outline", info: INFO.avgDay },
        ])}
        {monthBiggest && (
          <View style={styles.highlightCard}>
            <Ionicons name="flame-outline" size={20} color="#CD5D5D" />
            <Text style={styles.highlightText}>
              Biggest expense: <Text style={styles.highlightStrong}>{biggestLabel(monthBiggest)}</Text>
              {monthBiggest.category_name_snapshot ? ` · ${monthBiggest.category_name_snapshot}` : ""}
            </Text>
          </View>
        )}
        <SectionTitle title="Calendar" info={INFO.calendar} />
        {renderCalendar()}
        {selectedTypes.includes("Expense") && (
          <>
            <SectionTitle title="Expense Breakdown" info={INFO.expenses} />
            <View style={styles.card}>{renderDonut(expenseCategories, totalExpense, "Spent", "No expenses this month")}</View>
            {expenseCategories.length > 0 && (
              <View style={styles.card}>{renderBars(expenseCategories, totalExpense, "No expenses this month")}</View>
            )}
          </>
        )}
        {selectedTypes.includes("Income") && (
          <>
            <SectionTitle title="Income Breakdown" info={INFO.income} />
            <View style={styles.card}>{renderDonut(incomeCategories, totalIncome, "Earned", "No income this month")}</View>
            {incomeCategories.length > 0 && (
              <View style={styles.card}>{renderBars(incomeCategories, totalIncome, "No income this month")}</View>
            )}
          </>
        )}
        {renderTransfers()}
      </>
    );
  };

  const renderYearTab = () => (
    <>
      {renderSummaryCard(yearIncome, yearExpense)}
      {renderKpiRow([
        { label: "Savings Rate", value: savingsRate(yearIncome, yearExpense), color: "#4EA758", icon: "wallet-outline", info: INFO.savingsRate },
        { label: "Transactions", value: String(yearCount), color: "#A78BFA", icon: "receipt-outline", info: INFO.transactions },
        { label: "Avg / Month", value: `${fmtAmount(yearExpense / 12)}${sym}`, color: "#f0a500", icon: "calendar-outline", info: INFO.avgMonth },
      ])}
      {yearBiggest && (
        <View style={styles.highlightCard}>
          <Ionicons name="flame-outline" size={20} color="#CD5D5D" />
          <Text style={styles.highlightText}>
            Biggest expense: <Text style={styles.highlightStrong}>{biggestLabel(yearBiggest)}</Text>
            {yearBiggest.category_name_snapshot ? ` · ${yearBiggest.category_name_snapshot}` : ""}
          </Text>
        </View>
      )}
      <SectionTitle title="Monthly Trend" info={INFO.monthlyTrend} />
      <View style={styles.card}>{renderMonthlyTrend()}{trendLegend}</View>
      {selectedTypes.includes("Expense") && (
        <>
          <SectionTitle title="Expense Breakdown" info={INFO.expenses} />
          <View style={styles.card}>{renderDonut(yearExpenseCats, yearExpense, "Spent", "No expenses this year")}</View>
          {yearExpenseCats.length > 0 && (
            <View style={styles.card}>{renderBars(yearExpenseCats, yearExpense, "No expenses this year")}</View>
          )}
        </>
      )}
      {selectedTypes.includes("Income") && (
        <>
          <SectionTitle title="Income Breakdown" info={INFO.income} />
          <View style={styles.card}>{renderDonut(yearIncomeCats, yearIncome, "Earned", "No income this year")}</View>
          {yearIncomeCats.length > 0 && (
            <View style={styles.card}>{renderBars(yearIncomeCats, yearIncome, "No income this year")}</View>
          )}
        </>
      )}
      {renderTransfers()}
    </>
  );

  const renderAllTimeTab = () => (
    <>
      {renderSummaryCard(allIncome, allExpense)}
      {renderKpiRow([
        { label: "Savings Rate", value: savingsRate(allIncome, allExpense), color: "#4EA758", icon: "wallet-outline", info: INFO.savingsRate },
        { label: "Transactions", value: String(allCount), color: "#A78BFA", icon: "receipt-outline", info: INFO.transactions },
        { label: "Net Worth", value: `${fmtAmount(allIncome - allExpense)}${sym}`, color: (allIncome - allExpense) >= 0 ? "#4EA758" : "#CD5D5D", icon: "trending-up-outline", info: INFO.netWorth },
      ])}
      {allBiggest && (
        <View style={styles.highlightCard}>
          <Ionicons name="flame-outline" size={20} color="#CD5D5D" />
          <Text style={styles.highlightText}>
            Biggest expense ever: <Text style={styles.highlightStrong}>{biggestLabel(allBiggest)}</Text>
            {allBiggest.category_name_snapshot ? ` · ${allBiggest.category_name_snapshot}` : ""}
          </Text>
        </View>
      )}
      <SectionTitle title="Yearly Trend" info={INFO.yearlyTrend} />
      <View style={styles.card}>
        {renderYearlyTrend()}
        {yearlyTrend.length > 0 && trendLegend}
      </View>
      {selectedTypes.includes("Expense") && (
        <>
          <SectionTitle title="Top Expenses (All Time)" info={INFO.expenses} />
          <View style={styles.card}>{renderDonut(allExpenseCats, allExpense, "Spent", "No expense data")}</View>
          {allExpenseCats.length > 0 && (
            <View style={styles.card}>{renderBars(allExpenseCats, allExpense, "No expense data")}</View>
          )}
        </>
      )}
      {selectedTypes.includes("Income") && (
        <>
          <SectionTitle title="Top Income (All Time)" info={INFO.income} />
          <View style={styles.card}>{renderDonut(allIncomeCats, allIncome, "Earned", "No income data")}</View>
          {allIncomeCats.length > 0 && (
            <View style={styles.card}>{renderBars(allIncomeCats, allIncome, "No income data")}</View>
          )}
        </>
      )}
      <SectionTitle title="Account Balances" info={INFO.balances} />
      <View style={styles.card}>
        {accounts.length === 0 ? (
          <Text style={styles.emptyText}>No accounts</Text>
        ) : (
          accounts.map((acc, i) => (
            <View
              key={acc.account_id}
              style={[styles.accountRow, i < accounts.length - 1 && styles.accountRowBorder]}
            >
              <Text style={styles.accountName} numberOfLines={1}>
                {acc.account_emoji}{"  "}{acc.account_name}
              </Text>
              <Text
                style={[styles.accountBalance, acc.account_balance < 0 ? { color: "#CD5D5D" } : { color: "#4EA758" }]}
                numberOfLines={1}
              >
                {fmtAmount(acc.account_balance)}{sym}
              </Text>
            </View>
          ))
        )}
      </View>
      {renderTransfers()}
    </>
  );

  // ─── Filter modal ─────────────────────────────────────────────────────────────

  const sameSet = (a, b) =>
    JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
  const pendingHasChanges =
    filterVisible &&
    (!sameSet(pendingTypes, selectedTypes) ||
      !sameSet(pendingCategories, selectedCategories) ||
      !sameSet(pendingAccounts, selectedAccounts));

  const renderFilterModal = () => (
    <Modal
      visible={filterVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setFilterVisible(false)}
    >
      <TouchableWithoutFeedback onPress={() => setFilterVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.filterPanel}>

              <View style={styles.filterHeader}>
                <Text style={styles.filterTitle}>Filters</Text>
                <TouchableOpacity onPress={clearPending} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.filterClear}>Reset</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, marginVertical: 8 }}>

                {/* Transaction Type */}
                <Text style={styles.filterSectionLabel}>Transaction Type</Text>
                <View style={styles.typeRow}>
                  {ALL_TYPES.map((type) => {
                    const sel  = pendingTypes.includes(type);
                    const meta = TYPE_META[type];
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[styles.typePill, sel && { borderColor: meta.color, backgroundColor: meta.color + "22" }]}
                        onPress={() => togglePendingType(type)}
                      >
                        <Ionicons name={meta.icon} size={16} color={sel ? meta.color : "#888"} />
                        <Text style={[styles.typePillText, sel && { color: meta.color }]}>{type}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Categories */}
                {allCategories.length > 0 && (
                  <>
                    <View style={styles.filterSectionRow}>
                      <Text style={styles.filterSectionLabel}>Categories</Text>
                      {pendingCategories.length > 0 && (
                        <TouchableOpacity onPress={() => setPendingCategories([])}>
                          <Text style={styles.filterSectionClear}>Clear</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <View style={styles.chipsWrap}>
                      {allCategories.map((cat) => {
                        const sel = pendingCategories.includes(cat.category_id);
                        return (
                          <TouchableOpacity
                            key={cat.category_id}
                            style={[styles.chip, sel && styles.chipActive]}
                            onPress={() => togglePendingCategory(cat.category_id)}
                          >
                            <Text style={[styles.chipText, sel && styles.chipTextActive]}>
                              {cat.category_emoji || ""}{"  "}{cat.category_name}
                            </Text>
                            {sel && (
                              <Ionicons name="checkmark" size={12} color="#734BE9" style={{ marginLeft: 4 }} />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                )}

                {/* Accounts */}
                {allAccounts.length > 0 && (
                  <>
                    <View style={styles.filterSectionRow}>
                      <Text style={styles.filterSectionLabel}>Accounts</Text>
                      {pendingAccounts.length > 0 && (
                        <TouchableOpacity onPress={() => setPendingAccounts([])}>
                          <Text style={styles.filterSectionClear}>Clear</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <View style={styles.chipsWrap}>
                      {allAccounts.map((acc) => {
                        const sel = pendingAccounts.includes(acc.account_id);
                        return (
                          <TouchableOpacity
                            key={acc.account_id}
                            style={[styles.chip, sel && styles.chipActive]}
                            onPress={() => togglePendingAccount(acc.account_id)}
                          >
                            <Text style={[styles.chipText, sel && styles.chipTextActive]}>
                              {acc.account_emoji || ""}{"  "}{acc.account_name}
                            </Text>
                            {sel && (
                              <Ionicons name="checkmark" size={12} color="#734BE9" style={{ marginLeft: 4 }} />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                )}
              </ScrollView>

              <TouchableOpacity
                style={[styles.filterApply, !pendingHasChanges && styles.filterApplyDisabled]}
                onPress={applyFilter}
              >
                <Text style={styles.filterApplyText}>
                  {pendingHasChanges ? "Apply Filters" : "No Changes"}
                </Text>
              </TouchableOpacity>

            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  // ─── Active filter count for badge ───────────────────────────────────────────

  // Each active filter dimension adds 1 to the badge:
  // - type filter: active when not all 3 types are shown (show how many ARE shown, not excluded)
  // - category, account, search each add 1 per active item
  const activeFilterCount =
    (selectedTypes.length < ALL_TYPES.length ? selectedTypes.length : 0) +
    selectedCategories.length +
    selectedAccounts.length +
    (appliedSearch.trim() ? 1 : 0);

  // ─── Main render ──────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {dbInitialized && (
        <Title
          title={titleText}
          backIcon={activeTab !== "alltime" ? "chevron-back-outline" : undefined}
          onPressBackIcon={goBack}
          frontIcon={activeTab !== "alltime" ? "chevron-forward-outline" : undefined}
          onPressFrontIcon={goForward}
          actionButton={
            <TouchableOpacity onPress={openFilter} style={styles.filterBtn}>
              <Ionicons
                name={hasFilter ? "funnel" : "funnel-outline"}
                size={iconSize}
                color={hasFilter ? "#734BE9" : "#fff"}
              />
              {activeFilterCount > 0 && (
                <View style={styles.filterBadgeDot}>
                  <Text style={styles.filterBadgeDotText}>{activeFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          }
        />
      )}

      {/* Tab selector */}
      <View style={styles.tabRow}>
        {[
          { key: "month",   label: "Month" },
          { key: "year",    label: "Year" },
          { key: "alltime", label: "All Time" },
        ].map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, activeTab === key && styles.tabActive]}
            onPress={() => setActiveTab(key)}
          >
            <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search bar — identical style to home screen */}
      <View style={styles.searchBarContainer}>
        <Ionicons name="search-outline" size={18} color="#aaa" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search transactions..."
          placeholderTextColor="#666"
          value={searchText}
          onChangeText={onSearchChange}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => { setSearchText(""); setAppliedSearch(""); }}>
            <Ionicons name="close-circle" size={18} color="#aaa" />
          </TouchableOpacity>
        )}
      </View>

      {/* Active filter pills (horizontal scroll) */}
      {hasFilter && (
        <View style={styles.activePillsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activePillsContent}
        >
          {/* When not all types selected: show positive chips for the ones that ARE selected.
               Clicking × removes that type from the selection (stays ≥ 1). */}
          {selectedTypes.length < ALL_TYPES.length &&
            selectedTypes.map((t) => {
              const meta = TYPE_META[t];
              return (
                <View key={t} style={[styles.activePill, { borderColor: meta.color + "80" }]}>
                  <Ionicons name={meta.icon} size={11} color={meta.color} style={{ marginRight: 3 }} />
                  <Text style={[styles.activePillText, { color: meta.color }]}>{t}</Text>
                  {selectedTypes.length > 1 && (
                    <TouchableOpacity
                      onPress={() =>
                        setSelectedTypes((prev) => prev.filter((x) => x !== t))
                      }
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                    >
                      <Ionicons name="close" size={12} color={meta.color} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}

          {/* Search pill */}
          {appliedSearch.trim().length > 0 && (
            <View style={styles.activePill}>
              <Ionicons name="search-outline" size={11} color="#aaa" style={{ marginRight: 3 }} />
              <Text style={styles.activePillText} numberOfLines={1}>
                "{appliedSearch}"
              </Text>
              <TouchableOpacity
                onPress={() => { setSearchText(""); setAppliedSearch(""); }}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
              >
                <Ionicons name="close" size={12} color="#aaa" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
          )}

          {/* Category pills */}
          {selectedCategories.map((id) => {
            const cat = allCategories.find((c) => c.category_id === id);
            if (!cat) return null;
            return (
              <View key={id} style={styles.activePill}>
                <Text style={styles.activePillText}>
                  {cat.category_emoji || ""} {cat.category_name}
                </Text>
                <TouchableOpacity
                  onPress={() => setSelectedCategories((prev) => prev.filter((c) => c !== id))}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                >
                  <Ionicons name="close" size={12} color="#aaa" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            );
          })}

          {/* Account pills */}
          {selectedAccounts.map((id) => {
            const acc = allAccounts.find((a) => a.account_id === id);
            if (!acc) return null;
            return (
              <View key={id} style={[styles.activePill, { borderColor: "#734BE980" }]}>
                <Text style={[styles.activePillText, { color: "#A78BFA" }]}>
                  {acc.account_emoji || ""} {acc.account_name}
                </Text>
                <TouchableOpacity
                  onPress={() => setSelectedAccounts((prev) => prev.filter((a) => a !== id))}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                >
                  <Ionicons name="close" size={12} color="#A78BFA" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            );
          })}

          {/* Clear all */}
          <TouchableOpacity
            style={[styles.activePill, { borderColor: "#CD5D5D60" }]}
            onPress={() => {
              setSelectedTypes([...ALL_TYPES]);
              setSelectedCategories([]);
              setSelectedAccounts([]);
              setSearchText("");
              setAppliedSearch("");
            }}
          >
            <Text style={[styles.activePillText, { color: "#CD5D5D" }]}>Clear all</Text>
          </TouchableOpacity>
        </ScrollView>
        </View>
      )}

      <MonthSwiper
        triggerKey={`${activeTab}-${shownMonth}-${shownYear}`}
        directionRef={directionRef}
        enabled={activeTab !== "alltime"}
        onPrev={goBack}
        onNext={goForward}
      >
        {loading ? (
          <StatsSkeleton />
        ) : (
          <ScrollView
            style={{ width: "100%" }}
            contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16 }}
          >
            {appliedSearch.trim().length > 0 && renderSearchResults()}
            {activeTab === "month"   && renderMonthTab()}
            {activeTab === "year"    && renderYearTab()}
            {activeTab === "alltime" && renderAllTimeTab()}
          </ScrollView>
        )}
      </MonthSwiper>

      {renderFilterModal()}
    </View>
  );
};

export default Statistics;

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: "#1A1B25", alignItems: "center" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 50 },

  // ── Tabs ──────────────────────────────────────────────────────────────────────
  tabRow:        { flexDirection: "row", width: "90%", backgroundColor: "#2C2E42", borderRadius: 6, marginBottom: 10, padding: 3 },
  tab:           { flex: 1, paddingVertical: 7, alignItems: "center", borderRadius: 6 },
  tabActive:     { backgroundColor: "#734BE9" },
  tabText:       { color: "#aaa", fontSize: 14, fontWeight: "600" },
  tabTextActive: { color: "#fff" },

  // ── Search bar — matches home screen exactly ──────────────────────────────────
  searchBarContainer: {
    width: "90%",
    backgroundColor: "#2C2E42",
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 16 },

  // ── Active filter pills ───────────────────────────────────────────────────────
  activePillsWrapper:  { width: "90%", alignSelf: "center", marginBottom: 8 },
  activePillsContent:  { gap: 8, flexDirection: "row", alignItems: "center", paddingVertical: 4 },
  activePill: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#2C2E42", borderRadius: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: "#444",
  },
  activePillText: { color: "#aaa", fontSize: 13 },

  // ── Filter icon button with badge ─────────────────────────────────────────────
  filterBtn:          { position: "relative" },
  filterBadgeDot:     { position: "absolute", top: -4, right: -4, backgroundColor: "#734BE9", borderRadius: 6, width: 16, height: 16, alignItems: "center", justifyContent: "center" },
  filterBadgeDotText: { color: "#fff", fontSize: 9, fontWeight: "700" },

  // ── Summary card ──────────────────────────────────────────────────────────────
  summaryCard:    { backgroundColor: "#2C2E42", borderRadius: 6, padding: 16, flexDirection: "row", alignItems: "center", marginBottom: 18, marginTop: 4 },
  summaryItem:    { alignItems: "center", flex: 1 },
  summaryDivider: { width: 1, height: 40, backgroundColor: "#d9d9d920" },
  summaryLabel:   { color: "#aaa", fontSize: 13, marginBottom: 4 },
  summaryValue:   { fontSize: 17, fontWeight: "bold" },

  // ── Cards / sections ──────────────────────────────────────────────────────────
  sectionTitle: { color: "#fff", fontSize: 17, fontWeight: "700", marginBottom: 8 },
  card:         { backgroundColor: "#2C2E42", borderRadius: 6, padding: 14, marginBottom: 18 },

  // ── KPI cards ───────────────────────────────────────────────────────────────
  kpiRow:    { flexDirection: "row", gap: 10, marginBottom: 12 },
  kpiCard:   { flex: 1, backgroundColor: "#2C2E42", borderRadius: 6, paddingVertical: 14, paddingHorizontal: 6, alignItems: "center", gap: 4 },
  kpiValue:  { fontSize: 16, fontWeight: "bold", width: "100%", textAlign: "center" },
  kpiLabel:  { color: "#888", fontSize: 11, textAlign: "center" },

  // ── Highlight (biggest expense) card ──────────────────────────────────────────
  highlightCard:   { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#2C2E42", borderRadius: 6, padding: 14, marginBottom: 18, borderLeftWidth: 3, borderLeftColor: "#CD5D5D" },
  highlightText:   { color: "#ccc", fontSize: 13, flex: 1 },
  highlightStrong: { color: "#fff", fontWeight: "700" },

  // ── Donut chart ───────────────────────────────────────────────────────────────
  donutWrap:        { flexDirection: "row", alignItems: "center", gap: 14 },
  donutCenterLabel: { color: "#888", fontSize: 11 },
  donutCenterValue: { color: "#fff", fontSize: 15, fontWeight: "bold", paddingHorizontal: 6 },
  donutLegend:      { flex: 1, gap: 7 },
  donutLegendRow:   { flexDirection: "row", alignItems: "center", gap: 7 },
  donutLegendDot:   { width: 10, height: 10, borderRadius: 3 },
  donutLegendLabel: { color: "#ddd", fontSize: 13, flex: 1 },
  donutLegendPct:   { color: "#888", fontSize: 12, fontWeight: "600" },

  // ── Bar charts ────────────────────────────────────────────────────────────────
  barRow:     { marginBottom: 14 },
  barLabelRow:{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5, alignItems: "center" },
  barLabel:   { color: "#fff", fontSize: 14, flex: 1, marginRight: 8 },
  barAmount:  { color: "#aaa", fontSize: 12, textAlign: "right" },
  barTrack:   { height: 10, backgroundColor: "#1A1B25", borderRadius: 3, overflow: "hidden" },
  barFill:    { height: 10, borderRadius: 3 },
  emptyText:  { color: "#aaa", textAlign: "center", paddingVertical: 10, fontSize: 14 },

  // ── Calendar ──────────────────────────────────────────────────────────────────
  calWeekRow:    { flexDirection: "row", marginBottom: 4 },
  calWeekDay:    { flex: 1, textAlign: "center", color: "#666", fontSize: 11, fontWeight: "600" },
  calRow:        { flexDirection: "row", marginBottom: 2 },
  calCell:       { flex: 1, alignItems: "center", paddingVertical: 4, minHeight: 52 },
  calDayNum:     { color: "#ccc", fontSize: 13, fontWeight: "500" },
  calDot:        { width: 6, height: 6, borderRadius: 2, marginTop: 2 },
  calAmount:     { fontSize: 9, marginTop: 1, fontWeight: "600" },
  calLegend:     { flexDirection: "row", justifyContent: "center", gap: 16, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#d9d9d915" },
  calLegendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  calLegendText: { color: "#aaa", fontSize: 12 },

  // ── Trend charts ──────────────────────────────────────────────────────────────
  trendContainer:  { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  trendCol:        { flex: 1, alignItems: "center" },
  trendBarIncome:  { width: 6, backgroundColor: "#4EA758", borderRadius: 2 },
  trendBarExpense: { width: 6, backgroundColor: "#CD5D5D", borderRadius: 2 },
  trendLabel:      { color: "#666", fontSize: 9, marginTop: 4 },
  trendLegend:     { flexDirection: "row", justifyContent: "center", gap: 16, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#d9d9d915" },

  // ── Account rows ──────────────────────────────────────────────────────────────
  accountRow:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  accountRowBorder: { borderBottomColor: "#d9d9d920", borderBottomWidth: 1 },
  accountName:      { color: "#fff", fontSize: 15, flex: 1 },
  accountBalance:   { fontSize: 15, fontWeight: "bold", marginLeft: 8 },

  // ── Transfers ─────────────────────────────────────────────────────────────────
  transferHeader:     { flexDirection: "row", alignItems: "center", paddingBottom: 6 },
  transferStat:       { flex: 1, alignItems: "center" },
  transferStatValue:  { fontSize: 18, fontWeight: "bold" },
  transferStatLabel:  { color: "#888", fontSize: 12, marginTop: 2 },
  transferRow:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 9 },
  transferRoute:      { color: "#ddd", fontSize: 13, flex: 1, marginRight: 8 },
  transferAmt:        { color: "#734BE9", fontSize: 14, fontWeight: "600" },

  // ── Search results ──────────────────────────────────────────────────────────
  resultRow:    { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  resultTitle:  { color: "#fff", fontSize: 14, fontWeight: "500" },
  resultSub:    { color: "#888", fontSize: 12, marginTop: 2 },
  resultAmt:    { fontSize: 14, fontWeight: "700" },

  // ── Section title with info ─────────────────────────────────────────────────
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },

  // ── Filter modal ──────────────────────────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  filterPanel: {
    backgroundColor: "#1A1B25",
    borderTopLeftRadius: 12, borderTopRightRadius: 12,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32,
    height: "70%", width: "100%",
    borderTopWidth: 1, borderColor: "#2C2E42",
  },
  filterHeader:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  filterTitle:        { color: "#fff", fontSize: 20, fontWeight: "700" },
  filterClear:        { color: "#aaa", fontSize: 14 },
  filterSectionRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16, marginBottom: 8 },
  filterSectionLabel: { color: "#aaa", fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8 },
  filterSectionClear: { color: "#734BE9", fontSize: 12 },

  // Type pills
  typeRow: { flexDirection: "row", gap: 8 },
  typePill: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: "#2C2E42", borderRadius: 6,
    paddingVertical: 10, paddingHorizontal: 6,
    borderWidth: 1.5, borderColor: "#3a3a4a",
  },
  typePillText: { color: "#888", fontSize: 13, fontWeight: "600" },

  // Category / account chips
  chipsWrap:      { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip:           { flexDirection: "row", alignItems: "center", backgroundColor: "#2C2E42", borderRadius: 6, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: "#3a3a4a" },
  chipActive:     { backgroundColor: "#734BE915", borderColor: "#734BE9" },
  chipText:       { color: "#ccc", fontSize: 13 },
  chipTextActive: { color: "#734BE9" },

  // Apply button
  filterApply:         { backgroundColor: "#734BE9", borderRadius: 6, paddingVertical: 14, alignItems: "center", marginTop: 12 },
  filterApplyDisabled: { backgroundColor: "#3A3556" },
  filterApplyText:     { color: "#fff", fontSize: 17, fontWeight: "700" },
});
