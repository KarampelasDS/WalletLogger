import { View, StyleSheet } from "react-native";
import Skeleton from "./Skeleton";

// Placeholder that mimics the grouped-by-day transaction list while loading.
export default function TransactionsSkeleton({ days = 4, rowsPerDay = 3 }) {
  return (
    <View style={styles.container}>
      {Array.from({ length: days }).map((_, d) => (
        <View key={d} style={styles.card}>
          <View style={styles.header}>
            <Skeleton width={86} height={18} />
            <Skeleton width={70} height={14} />
          </View>
          {Array.from({ length: rowsPerDay }).map((__, r) => (
            <View key={r} style={styles.row}>
              <Skeleton width="48%" height={13} />
              <Skeleton width="22%" height={13} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    paddingTop: 4,
  },
  card: {
    width: "90%",
    backgroundColor: "#2C2E42",
    borderRadius: 8,
    marginVertical: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomColor: "#d9d9d915",
    borderBottomWidth: 2,
    paddingBottom: 10,
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
  },
});
