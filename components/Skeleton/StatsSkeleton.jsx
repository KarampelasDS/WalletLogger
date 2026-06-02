import { View, StyleSheet } from "react-native";
import Skeleton from "./Skeleton";

// Placeholder that mimics the statistics layout (summary, KPIs, chart cards).
export default function StatsSkeleton() {
  return (
    <View style={styles.container}>
      {/* Summary card */}
      <View style={[styles.card, styles.summaryCard]}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.summaryItem}>
            <Skeleton width={50} height={12} />
            <Skeleton width={70} height={18} style={{ marginTop: 8 }} />
          </View>
        ))}
      </View>

      {/* KPI row */}
      <View style={styles.kpiRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.kpiCard}>
            <Skeleton width={44} height={16} />
            <Skeleton width={60} height={10} style={{ marginTop: 8 }} />
          </View>
        ))}
      </View>

      {/* Two chart cards */}
      {[0, 1].map((i) => (
        <View key={i} style={[styles.card, { marginBottom: 18 }]}>
          <Skeleton width={130} height={16} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={12} style={{ marginBottom: 10 }} />
          <Skeleton width="80%" height={12} style={{ marginBottom: 10 }} />
          <Skeleton width="90%" height={12} style={{ marginBottom: 10 }} />
          <Skeleton width="65%" height={12} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", paddingHorizontal: 16, paddingTop: 4 },
  card: { backgroundColor: "#2C2E42", borderRadius: 6, padding: 16 },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    marginTop: 4,
  },
  summaryItem: { flex: 1, alignItems: "center" },
  kpiRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
  kpiCard: {
    flex: 1,
    backgroundColor: "#2C2E42",
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: "center",
  },
});
