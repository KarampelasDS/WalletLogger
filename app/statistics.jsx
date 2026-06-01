import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  TextInput,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import Title from "../components/Title/Title";
import { Store } from "../stores/Store";
import { fmtAmount } from "../utils/format";

const months = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];
const BAR_COLORS = [
  "#734BE9","#4EA758","#9ac9e3","#f0a500",
  "#e96b9a","#4db8c0","#a07edc","#7ec47e","#dc9e7e","#5cc8e9",
];
const WEEKDAYS  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const ALL_TYPES = ["Income","Expense","Transfer"];

const TYPE_META = {
  Income:   { color: "#4EA758", icon: "trending-up-outline" },
  Expense:  { color: "#CD5D5D", icon: "trending-down-outline" },
  Transfer: { color: "#734BE9", icon: "swap-horizontal-outline" },
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

const Statistics = () => {
  const db            = Store((s) => s.db);
  const dbInitialized = Store((s) => s.dbInitialized);
  const mainCurrency  = Store((s) => s.mainCurrency);
  const currentDate   = Store((s) => s.currentDate);
  const iconSize      = Store((s) => s.iconSize);

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

  // ── Year data ────────────────────────────────────────────────────────────────
  const [yearIncome,      setYearIncome]      = useState(0);
  const [yearExpense,     setYearExpense]      = useState(0);
  const [monthlyTrend,    setMonthlyTrend]    = useState([]);
  const [yearExpenseCats, setYearExpenseCats] = useState([]);
  const [yearIncomeCats,  setYearIncomeCats]  = useState([]);

  // ── All-time data ────────────────────────────────────────────────────────────
  const [allIncome,      setAllIncome]      = useState(0);
  const [allExpense,     setAllExpense]      = useState(0);
  const [allExpenseCats, setAllExpenseCats]  = useState([]);
  const [allIncomeCats,  setAllIncomeCats]   = useState([]);
  const [yearlyTrend,    setYearlyTrend]     = useState([]);
  const [accounts,       setAccounts]        = useState([]);

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
    if (activeTab === "month")     fetchMonthStats(catSQL, accSQL, srchSQL, types);
    else if (activeTab === "year") fetchYearStats(catSQL, accSQL, srchSQL, types);
    else                           fetchAllTimeStats(catSQL, accSQL, srchSQL, types);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbInitialized, shownMonth, shownYear, activeTab,
      selectedCategories, selectedAccounts, selectedTypes, appliedSearch]);

  // ─── Fetch functions ──────────────────────────────────────────────────────────

  const amtExpr = "COALESCE(transaction_secondCurrencyAmount, transaction_amount)";

  const fetchMonthStats = async (catSQL, accSQL, srchSQL, types) => {
    setLoading(true);
    try {
      const m  = String(shownMonth + 1).padStart(2, "0");
      const y  = String(shownYear);
      const dw = `AND strftime('%Y',transaction_date)='${y}' AND strftime('%m',transaction_date)='${m}'`;
      const doInc = types.includes("Income");
      const doExp = types.includes("Expense");

      const [inc, exp, expCats, incCats, calRows] = await Promise.all([
        doInc
          ? db.getFirstAsync(`SELECT COALESCE(SUM(${amtExpr}),0) as total FROM transactions WHERE transaction_type='Income' ${dw} ${catSQL} ${accSQL} ${srchSQL}`)
          : Promise.resolve({ total: 0 }),
        doExp
          ? db.getFirstAsync(`SELECT COALESCE(SUM(${amtExpr}),0) as total FROM transactions WHERE transaction_type='Expense' ${dw} ${catSQL} ${accSQL} ${srchSQL}`)
          : Promise.resolve({ total: 0 }),
        doExp
          ? db.getAllAsync(`SELECT category_name_snapshot, category_emoji_snapshot, SUM(${amtExpr}) as total FROM transactions WHERE transaction_type='Expense' ${dw} ${catSQL} ${accSQL} ${srchSQL} GROUP BY category_id, category_name_snapshot ORDER BY total DESC`)
          : Promise.resolve([]),
        doInc
          ? db.getAllAsync(`SELECT category_name_snapshot, category_emoji_snapshot, SUM(${amtExpr}) as total FROM transactions WHERE transaction_type='Income' ${dw} ${catSQL} ${accSQL} ${srchSQL} GROUP BY category_id, category_name_snapshot ORDER BY total DESC`)
          : Promise.resolve([]),
        // Calendar always shows Income/Expense (Transfer has no meaningful income/expense value)
        db.getAllAsync(
          `SELECT CAST(strftime('%d',transaction_date) AS INTEGER) as day,
           SUM(CASE WHEN transaction_type='Income' THEN ${amtExpr} ELSE 0 END) as income,
           SUM(CASE WHEN transaction_type='Expense' THEN ${amtExpr} ELSE 0 END) as expense
           FROM transactions
           WHERE transaction_type IN ('Income','Expense') ${dw} ${catSQL} ${accSQL} ${srchSQL}
           GROUP BY day ORDER BY day`
        ),
      ]);

      setTotalIncome(inc?.total || 0);
      setTotalExpense(exp?.total || 0);
      setExpenseCategories(expCats);
      setIncomeCategories(incCats);
      const map = {};
      calRows.forEach((r) => { map[r.day] = r; });
      setCalendarData(map);
    } catch (e) {
      console.error("fetchMonthStats:", e);
    } finally { setLoading(false); }
  };

  const fetchYearStats = async (catSQL, accSQL, srchSQL, types) => {
    setLoading(true);
    try {
      const y  = String(shownYear);
      const yw = `AND strftime('%Y',transaction_date)='${y}'`;
      const doInc = types.includes("Income");
      const doExp = types.includes("Expense");
      const typeSQL = types.length
        ? `AND transaction_type IN (${types.map((t) => `'${t}'`).join(",")})` : "AND 1=0";

      const [inc, exp, trend, expCats, incCats] = await Promise.all([
        doInc
          ? db.getFirstAsync(`SELECT COALESCE(SUM(${amtExpr}),0) as total FROM transactions WHERE transaction_type='Income' ${yw} ${catSQL} ${accSQL} ${srchSQL}`)
          : Promise.resolve({ total: 0 }),
        doExp
          ? db.getFirstAsync(`SELECT COALESCE(SUM(${amtExpr}),0) as total FROM transactions WHERE transaction_type='Expense' ${yw} ${catSQL} ${accSQL} ${srchSQL}`)
          : Promise.resolve({ total: 0 }),
        db.getAllAsync(
          `SELECT strftime('%m',transaction_date) as month,
           SUM(CASE WHEN transaction_type='Income' THEN ${amtExpr} ELSE 0 END) as income,
           SUM(CASE WHEN transaction_type='Expense' THEN ${amtExpr} ELSE 0 END) as expense
           FROM transactions WHERE 1=1 ${yw} ${typeSQL} ${catSQL} ${accSQL} ${srchSQL}
           GROUP BY month ORDER BY month`
        ),
        doExp
          ? db.getAllAsync(`SELECT category_name_snapshot, category_emoji_snapshot, SUM(${amtExpr}) as total FROM transactions WHERE transaction_type='Expense' ${yw} ${catSQL} ${accSQL} ${srchSQL} GROUP BY category_id, category_name_snapshot ORDER BY total DESC LIMIT 10`)
          : Promise.resolve([]),
        doInc
          ? db.getAllAsync(`SELECT category_name_snapshot, category_emoji_snapshot, SUM(${amtExpr}) as total FROM transactions WHERE transaction_type='Income' ${yw} ${catSQL} ${accSQL} ${srchSQL} GROUP BY category_id, category_name_snapshot ORDER BY total DESC LIMIT 10`)
          : Promise.resolve([]),
      ]);

      setYearIncome(inc?.total || 0);
      setYearExpense(exp?.total || 0);
      setMonthlyTrend(trend);
      setYearExpenseCats(expCats);
      setYearIncomeCats(incCats);
    } catch (e) {
      console.error("fetchYearStats:", e);
    } finally { setLoading(false); }
  };

  const fetchAllTimeStats = async (catSQL, accSQL, srchSQL, types) => {
    setLoading(true);
    try {
      const doInc = types.includes("Income");
      const doExp = types.includes("Expense");
      const typeSQL = `AND transaction_type IN (${types.map((t) => `'${t}'`).join(",")})`;

      const [inc, exp, expCats, incCats, yt, accs] = await Promise.all([
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
      ]);

      setAllIncome(inc?.total || 0);
      setAllExpense(exp?.total || 0);
      setAllExpenseCats(expCats);
      setAllIncomeCats(incCats);
      setYearlyTrend(yt.reverse());
      setAccounts(accs);
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

  const goBack = () => {
    if (activeTab === "month") {
      if (shownMonth === 0) { setShownYear((y) => y - 1); setShownMonth(11); }
      else setShownMonth((m) => m - 1);
    } else if (activeTab === "year") setShownYear((y) => y - 1);
  };

  const goForward = () => {
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

  const renderMonthTab = () => (
    <>
      {renderSummaryCard(totalIncome, totalExpense)}
      <Text style={styles.sectionTitle}>Calendar</Text>
      {renderCalendar()}
      {selectedTypes.includes("Expense") && (
        <>
          <Text style={styles.sectionTitle}>Expenses by Category</Text>
          <View style={styles.card}>{renderBars(expenseCategories, totalExpense, "No expenses this month")}</View>
        </>
      )}
      {selectedTypes.includes("Income") && (
        <>
          <Text style={styles.sectionTitle}>Income by Category</Text>
          <View style={styles.card}>{renderBars(incomeCategories, totalIncome, "No income this month")}</View>
        </>
      )}
    </>
  );

  const renderYearTab = () => (
    <>
      {renderSummaryCard(yearIncome, yearExpense)}
      <Text style={styles.sectionTitle}>Monthly Trend</Text>
      <View style={styles.card}>{renderMonthlyTrend()}{trendLegend}</View>
      {selectedTypes.includes("Expense") && (
        <>
          <Text style={styles.sectionTitle}>Expenses by Category</Text>
          <View style={styles.card}>{renderBars(yearExpenseCats, yearExpense, "No expenses this year")}</View>
        </>
      )}
      {selectedTypes.includes("Income") && (
        <>
          <Text style={styles.sectionTitle}>Income by Category</Text>
          <View style={styles.card}>{renderBars(yearIncomeCats, yearIncome, "No income this year")}</View>
        </>
      )}
    </>
  );

  const renderAllTimeTab = () => (
    <>
      {renderSummaryCard(allIncome, allExpense)}
      <Text style={styles.sectionTitle}>Yearly Trend</Text>
      <View style={styles.card}>
        {renderYearlyTrend()}
        {yearlyTrend.length > 0 && trendLegend}
      </View>
      {selectedTypes.includes("Expense") && (
        <>
          <Text style={styles.sectionTitle}>Top Expenses (All Time)</Text>
          <View style={styles.card}>{renderBars(allExpenseCats, allExpense, "No expense data")}</View>
        </>
      )}
      {selectedTypes.includes("Income") && (
        <>
          <Text style={styles.sectionTitle}>Top Income (All Time)</Text>
          <View style={styles.card}>{renderBars(allIncomeCats, allIncome, "No income data")}</View>
        </>
      )}
      <Text style={styles.sectionTitle}>Account Balances</Text>
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
    </>
  );

  // ─── Filter modal ─────────────────────────────────────────────────────────────

  const pendingHasChanges =
    JSON.stringify([...pendingTypes].sort()) !== JSON.stringify([...selectedTypes].sort()) ||
    JSON.stringify([...pendingCategories].sort()) !== JSON.stringify([...selectedCategories].sort()) ||
    JSON.stringify([...pendingAccounts].sort()) !== JSON.stringify([...selectedAccounts].sort());

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
                <Text style={[styles.activePillText, { color: "#9ac9e3" }]}>
                  {acc.account_emoji || ""} {acc.account_name}
                </Text>
                <TouchableOpacity
                  onPress={() => setSelectedAccounts((prev) => prev.filter((a) => a !== id))}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                >
                  <Ionicons name="close" size={12} color="#9ac9e3" style={{ marginLeft: 4 }} />
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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#734BE9" />
        </View>
      ) : (
        <ScrollView
          style={{ width: "100%" }}
          contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16 }}
        >
          {activeTab === "month"   && renderMonthTab()}
          {activeTab === "year"    && renderYearTab()}
          {activeTab === "alltime" && renderAllTimeTab()}
        </ScrollView>
      )}

      {renderFilterModal()}
    </View>
  );
};

export default Statistics;

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: "#1A1B25", alignItems: "center" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 50 },

  // ── Tabs ──────────────────────────────────────────────────────────────────────
  tabRow:        { flexDirection: "row", width: "90%", backgroundColor: "#2C2E42", borderRadius: 10, marginBottom: 10, padding: 3 },
  tab:           { flex: 1, paddingVertical: 7, alignItems: "center", borderRadius: 8 },
  tabActive:     { backgroundColor: "#734BE9" },
  tabText:       { color: "#aaa", fontSize: 14, fontWeight: "600" },
  tabTextActive: { color: "#fff" },

  // ── Search bar — matches home screen exactly ──────────────────────────────────
  searchBarContainer: {
    width: "90%",
    backgroundColor: "#2C2E42",
    borderRadius: 10,
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
    backgroundColor: "#2C2E42", borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: "#444",
  },
  activePillText: { color: "#aaa", fontSize: 13 },

  // ── Filter icon button with badge ─────────────────────────────────────────────
  filterBtn:          { position: "relative" },
  filterBadgeDot:     { position: "absolute", top: -4, right: -4, backgroundColor: "#734BE9", borderRadius: 8, width: 16, height: 16, alignItems: "center", justifyContent: "center" },
  filterBadgeDotText: { color: "#fff", fontSize: 9, fontWeight: "700" },

  // ── Summary card ──────────────────────────────────────────────────────────────
  summaryCard:    { backgroundColor: "#2C2E42", borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", marginBottom: 18, marginTop: 4 },
  summaryItem:    { alignItems: "center", flex: 1 },
  summaryDivider: { width: 1, height: 40, backgroundColor: "#d9d9d920" },
  summaryLabel:   { color: "#aaa", fontSize: 13, marginBottom: 4 },
  summaryValue:   { fontSize: 17, fontWeight: "bold" },

  // ── Cards / sections ──────────────────────────────────────────────────────────
  sectionTitle: { color: "#fff", fontSize: 17, fontWeight: "700", marginBottom: 8 },
  card:         { backgroundColor: "#2C2E42", borderRadius: 14, padding: 14, marginBottom: 18 },

  // ── Bar charts ────────────────────────────────────────────────────────────────
  barRow:     { marginBottom: 14 },
  barLabelRow:{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5, alignItems: "center" },
  barLabel:   { color: "#fff", fontSize: 14, flex: 1, marginRight: 8 },
  barAmount:  { color: "#aaa", fontSize: 12, textAlign: "right" },
  barTrack:   { height: 10, backgroundColor: "#1A1B25", borderRadius: 5, overflow: "hidden" },
  barFill:    { height: 10, borderRadius: 5 },
  emptyText:  { color: "#aaa", textAlign: "center", paddingVertical: 10, fontSize: 14 },

  // ── Calendar ──────────────────────────────────────────────────────────────────
  calWeekRow:    { flexDirection: "row", marginBottom: 4 },
  calWeekDay:    { flex: 1, textAlign: "center", color: "#666", fontSize: 11, fontWeight: "600" },
  calRow:        { flexDirection: "row", marginBottom: 2 },
  calCell:       { flex: 1, alignItems: "center", paddingVertical: 4, minHeight: 52 },
  calDayNum:     { color: "#ccc", fontSize: 13, fontWeight: "500" },
  calDot:        { width: 6, height: 6, borderRadius: 3, marginTop: 2 },
  calAmount:     { fontSize: 9, marginTop: 1, fontWeight: "600" },
  calLegend:     { flexDirection: "row", justifyContent: "center", gap: 16, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#d9d9d915" },
  calLegendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  calLegendText: { color: "#aaa", fontSize: 12 },

  // ── Trend charts ──────────────────────────────────────────────────────────────
  trendContainer:  { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  trendCol:        { flex: 1, alignItems: "center" },
  trendBarIncome:  { width: 6, backgroundColor: "#4EA758", borderRadius: 3 },
  trendBarExpense: { width: 6, backgroundColor: "#CD5D5D", borderRadius: 3 },
  trendLabel:      { color: "#666", fontSize: 9, marginTop: 4 },
  trendLegend:     { flexDirection: "row", justifyContent: "center", gap: 16, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#d9d9d915" },

  // ── Account rows ──────────────────────────────────────────────────────────────
  accountRow:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  accountRowBorder: { borderBottomColor: "#d9d9d920", borderBottomWidth: 1 },
  accountName:      { color: "#fff", fontSize: 15, flex: 1 },
  accountBalance:   { fontSize: 15, fontWeight: "bold", marginLeft: 8 },

  // ── Filter modal ──────────────────────────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  filterPanel: {
    backgroundColor: "#1A1B25",
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
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
    backgroundColor: "#2C2E42", borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 6,
    borderWidth: 1.5, borderColor: "#3a3a4a",
  },
  typePillText: { color: "#888", fontSize: 13, fontWeight: "600" },

  // Category / account chips
  chipsWrap:      { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip:           { flexDirection: "row", alignItems: "center", backgroundColor: "#2C2E42", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: "#3a3a4a" },
  chipActive:     { backgroundColor: "#734BE915", borderColor: "#734BE9" },
  chipText:       { color: "#ccc", fontSize: 13 },
  chipTextActive: { color: "#734BE9" },

  // Apply button
  filterApply:         { backgroundColor: "#734BE9", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 12 },
  filterApplyDisabled: { backgroundColor: "#2C2E42" },
  filterApplyText:     { color: "#fff", fontSize: 17, fontWeight: "700" },
});
