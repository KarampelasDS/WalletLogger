import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import Title from "../../components/Title/Title";
import { Store } from "../../stores/Store";
import { exportDatabase, shareBackup, restoreDatabase } from "../../utils/backup";
import { importExternalDatabase } from "../../utils/importExternal";

export default function Backup() {
  const router = useRouter();
  const db = Store((state) => state.db);
  const initDB = Store((state) => state.initDB);
  const setMainCurrency = Store((state) => state.setMainCurrency);
  const setDbUpToDate = Store((state) => state.setDbUpToDate);
  const iconSize = Store((state) => state.iconSize);
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await exportDatabase(db);
      if (result.success) {
        Toast.show({
          type: "success",
          text1: "Backup saved",
          text2: result.fileName,
        });
      }
      // "cancelled" => silent
    } catch (err) {
      console.error("Export failed:", err);
      Toast.show({ type: "error", text1: "Export failed", text2: String(err.message || err) });
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await shareBackup(db);
    } catch (err) {
      console.error("Share failed:", err);
      Toast.show({ type: "error", text1: "Share failed", text2: String(err.message || err) });
    } finally {
      setBusy(false);
    }
  };

  const applyMainCurrency = (main) => {
    if (main) {
      setMainCurrency({
        currency_id: main.currency_id,
        currency_name: main.currency_name,
        currency_symbol: main.currency_symbol,
        currency_shorthand: main.currency_shorthand,
        conversion_rate_to_main: main.conversion_rate_to_main,
      });
    }
  };

  const handleImport = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await importExternalDatabase(db);
      if (!result.success) {
        if (result.reason === "invalid") {
          Toast.show({
            type: "error",
            text1: "Unsupported file",
            text2: "That file isn't a supported data export.",
          });
        }
        return;
      }
      applyMainCurrency(result.main);
      setDbUpToDate(false);
      const c = result.counts;
      Toast.show({
        type: "success",
        text1: "Import complete",
        text2:
          `${c.transactions} transactions, ${c.accounts} accounts, ${c.categories} categories` +
          (c.skippedCurrencies > 0
            ? ` · ${c.skippedCurrencies} unsupported ${
                c.skippedCurrencies === 1 ? "currency" : "currencies"
              } skipped`
            : ""),
      });
      router.replace("/");
    } catch (err) {
      console.error("Data import failed:", err);
      Toast.show({ type: "error", text1: "Import failed", text2: String(err.message || err) });
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await restoreDatabase(db);
      if (!result.success) {
        if (result.reason === "invalid") {
          Toast.show({
            type: "error",
            text1: "Not a valid backup",
            text2: "That file isn't a Wallet Logger database.",
          });
        }
        // "cancelled" / "no-file" => silent
        return;
      }

      // Reopen the freshly-swapped database file
      const newDb = await initDB();

      // The restored DB may use a different main currency than what's cached
      const main = await newDb.getFirstAsync(`
        SELECT c.currency_id, c.currency_name, c.currency_symbol, c.currency_shorthand,
               uc.conversion_rate_to_main
        FROM user_currencies uc
        JOIN currencies c ON uc.currency_id = c.currency_id
        WHERE uc.is_main = 1
        LIMIT 1
      `);
      applyMainCurrency(main);

      setDbUpToDate(false);
      Toast.show({ type: "success", text1: "Backup restored" });
      router.replace("/");
    } catch (err) {
      console.error("Restore failed:", err);
      Toast.show({ type: "error", text1: "Restore failed", text2: String(err.message || err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Title
        title="Backup & Restore"
        backIcon="chevron-back-outline"
        onPressBackIcon={() => router.back()}
      />

      <View style={styles.body}>
        <Text style={styles.blurb}>
          Your data lives only on this device. Export a backup file you can keep
          safe or move to a new phone, then restore it here anytime.
        </Text>

        <TouchableOpacity
          style={[styles.card, busy && styles.cardDisabled]}
          activeOpacity={0.8}
          onPress={handleExport}
          disabled={busy}
        >
          <Ionicons name="cloud-upload-outline" size={iconSize + 4} color="#fff" />
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Export backup</Text>
            <Text style={styles.cardSub}>Save a .db file to a folder you choose</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkRow}
          activeOpacity={0.7}
          onPress={handleShare}
          disabled={busy}
        >
          <Ionicons name="share-outline" size={16} color="#fff" />
          <Text style={styles.linkText}>Share a copy instead (Drive, email, Files…)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, busy && styles.cardDisabled]}
          activeOpacity={0.8}
          onPress={handleRestore}
          disabled={busy}
        >
          <Ionicons name="cloud-download-outline" size={iconSize + 4} color="#fff" />
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Restore backup</Text>
            <Text style={styles.cardSub}>Replace all current data with a backup file</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>Migrate</Text>

        <TouchableOpacity
          style={[styles.card, busy && styles.cardDisabled]}
          activeOpacity={0.8}
          onPress={handleImport}
          disabled={busy}
        >
          <Ionicons name="swap-horizontal-outline" size={iconSize + 4} color="#fff" />
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Import data</Text>
            <Text style={styles.cardSub}>
              Replace all data with a database export from another expense app
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.warning}>
          <Ionicons name="warning-outline" size={18} color="#CD9A5D" />
          <Text style={styles.warningText}>
            Restoring or importing overwrites everything currently in the app.
            Export first if you want to keep your current data.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1B25",
    alignItems: "center",
  },
  body: {
    width: "90%",
    gap: 12,
  },
  blurb: {
    color: "#B9BACA",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#2C2E42",
    padding: 16,
    borderRadius: 6,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginTop: -4,
  },
  linkText: {
    color: "#B9BACA",
    fontSize: 13,
    fontWeight: "500",
  },
  sectionLabel: {
    color: "#8E8FA3",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 2,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  cardSub: {
    color: "#8E8FA3",
    fontSize: 13,
    marginTop: 2,
  },
  warning: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#2C2E42",
    padding: 14,
    borderRadius: 6,
    marginTop: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#CD9A5D",
  },
  warningText: {
    color: "#B9BACA",
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
});
