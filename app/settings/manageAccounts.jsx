import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useEffect, useState } from "react";
import { Store } from "../../stores/Store";
import { Ionicons } from "@expo/vector-icons";
import DragList from "react-native-draglist";
import InputModal from "../../components/InputModal/InputModal";
import ConfirmModal from "../../components/ConfrimModal/ConfirmModal";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import Title from "../../components/Title/Title";
import { useNavigation } from "@react-navigation/native";

export default function ManageAccounts() {
  const router = useRouter();
  const db = Store((state) => state.db);
  const setShowNavbar = Store((state) => state.setShowNavbar);
  const mainCurrency = Store((state) => state.mainCurrency);
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalMode, setModalMode] = useState("edit");
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [accountName, setAccountName] = useState("");
  const [accountEmoji, setAccountEmoji] = useState("");
  const [accountBalance, setAccountBalance] = useState("0");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);

  setShowNavbar(true);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const data = await db.getAllAsync(
          "SELECT * FROM accounts ORDER BY account_order ASC"
        );
        setAccounts(data);
      } catch (err) {
        console.error("Failed to fetch accounts:", err);
        Toast.show({ type: "error", text1: "Error loading accounts" });
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  function keyExtractor(item) {
    return item.account_id.toString();
  }

  const handleAdd = () => {
    setModalMode("add");
    setAccountName("");
    setAccountEmoji("🏦");
    setAccountBalance("0");
    setEditingAccountId(null);
    setShowEditModal(true);
  };

  const handleEdit = (acc) => {
    setModalMode("edit");
    setEditingAccountId(acc.account_id);
    setAccountName(acc.account_name);
    setAccountEmoji(acc.account_emoji);
    setAccountBalance(String(acc.account_balance));
    setShowEditModal(true);
  };

  const handleDeletePress = (acc) => {
    setAccountToDelete(acc);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await db.runAsync(
        "UPDATE transactions SET account_id = NULL WHERE account_id = ?",
        [accountToDelete.account_id]
      );

      await db.runAsync("DELETE FROM accounts WHERE account_id = ?", [
        accountToDelete.account_id,
      ]);

      setAccounts((prev) =>
        prev.filter((acc) => acc.account_id !== accountToDelete.account_id)
      );

      Toast.show({ type: "success", text1: "Deleted Account" });
    } catch (err) {
      console.error("Delete error:", err);
      Toast.show({ type: "error", text1: "Failed to delete account" });
    } finally {
      setShowDeleteModal(false);
      setAccountToDelete(null);
    }
  };

  const handleSave = async (newName, newEmoji, newBalance) => {
    try {
      if (modalMode === "add") {
        await db.runAsync(
          "INSERT INTO accounts (account_name, account_emoji, account_balance, account_order) VALUES (?, ?, ?, ?)",
          [newName, newEmoji, newBalance || "0", accounts.length]
        );
        Toast.show({ type: "success", text1: "Added Account" });
      } else {
        await db.runAsync(
          "UPDATE accounts SET account_name = ?, account_emoji = ? WHERE account_id = ?",
          [newName, newEmoji, editingAccountId]
        );
        Toast.show({ type: "success", text1: "Edited Account" });
      }

      const data = await db.getAllAsync(
        "SELECT * FROM accounts ORDER BY account_order ASC"
      );
      setAccounts(data);
      setShowEditModal(false);
      setEditingAccountId(null);
      setModalMode("edit");
    } catch (err) {
      console.error("Save error:", err);
      Toast.show({ type: "error", text1: "Failed to save changes" });
    }
  };

  const onReordered = async (fromIndex, toIndex) => {
    const copy = [...accounts];
    const removed = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, removed[0]);
    setAccounts(copy);

    try {
      for (let i = 0; i < copy.length; i++) {
        await db.runAsync(
          "UPDATE accounts SET account_order = ? WHERE account_id = ?",
          [i, copy[i].account_id]
        );
      }
    } catch (err) {
      console.error("Reorder error:", err);
    }
  };

  const renderItem = (info) => {
    const { item, onDragStart, onDragEnd, isActive } = info;

    return (
      <View
        key={item.account_id}
        style={[
          styles.item,
          isActive && {
            backgroundColor: "#393B50",
            transform: [{ scale: 1.03 }],
          },
        ]}
      >
        <View style={styles.itemLeft}>
          <Text style={styles.itemEmoji}>{item.account_emoji}</Text>
          <View>
            <Text
              style={[styles.itemName, { maxWidth: 140 }]}
              numberOfLines={1}
            >
              {item.account_name}
            </Text>
            <Text style={styles.balanceText}>
              {Number(item.account_balance).toLocaleString("en-US", {
                maximumFractionDigits: 2,
              })}{" "}
              {mainCurrency.currency_symbol}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 15 }}>
          <TouchableOpacity
            onPress={() => handleDeletePress(item)}
            style={{ paddingVertical: 10 }}
            activeOpacity={0.9}
          >
            <Ionicons name="close-outline" size={30} color="#ff5c5c" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleEdit(item)}
            style={{ paddingVertical: 10 }}
            activeOpacity={0.9}
          >
            <Ionicons name="create-outline" size={30} color="#aaa" />
          </TouchableOpacity>
          <TouchableOpacity
            hitSlop={{ top: 20, bottom: 20, left: 12, right: 20 }}
            style={{ paddingVertical: 10 }}
            activeOpacity={0.9}
            onPressIn={onDragStart}
            onPressOut={onDragEnd}
          >
            <Ionicons name="menu" size={30} color="#aaa" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <>
      <View style={styles.container}>
        <Title
          title="Manage Accounts"
          backIcon="arrow-back-circle-outline"
          onPressBackIcon={() => navigation.goBack()}
        />
        <View style={styles.topBlock}>
          <Text style={styles.introSubText}>Add, edit or delete accounts</Text>
        </View>
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#734BE9"
            style={{ marginTop: 50 }}
          />
        ) : (
          <View style={styles.listContainer}>
            <DragList
              data={accounts}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              onReordered={onReordered}
            />
          </View>
        )}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAdd}
            activeOpacity={0.92}
          >
            <Ionicons name="add-circle-outline" size={32} color="#fff" />
            <Text style={styles.addText}>Add Account</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showEditModal && (
        <InputModal
          title={modalMode === "add" ? "Add Account" : "Edit Account"}
          categoryName={accountName}
          categoryEmoji={accountEmoji}
          categoryBalance={accountBalance}
          modalMode={modalMode}
          accountMode={true}
          onSave={handleSave}
          onClose={() => {
            setShowEditModal(false);
            setEditingAccountId(null);
            setModalMode("edit");
          }}
        />
      )}

      {accountToDelete && (
        <ConfirmModal
          visible={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
          itemName={accountToDelete.account_name}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1B25",
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "flex-end",
  },
  topBlock: {
    alignItems: "center",
    marginBottom: 8,
  },
  introText: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
  },
  introSubText: {
    color: "#aaa",
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  listContainer: {
    width: "85%",
    flex: 1,
    alignSelf: "center",
    marginBottom: 6,
    marginTop: 3,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2C2E42",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 15,
    marginTop: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 2,
    gap: 8,
    alignSelf: "center",
    marginBottom: "25%",
  },
  addText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 2,
    letterSpacing: 0.5,
  },
  item: {
    backgroundColor: "#2C2E42",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  itemLeft: { flexDirection: "row", alignItems: "center" },
  itemEmoji: { fontSize: 22, marginRight: 10 },
  itemName: { color: "#fff", fontSize: 18, fontWeight: "500" },
  balanceText: {
    color: "#9ac9e3",
    fontSize: 15,
    fontWeight: "500",
    marginTop: 3,
  },
  buttons: {
    width: "85%",
    alignSelf: "center",
    marginBottom: 18,
    gap: 10,
    justifyContent: "flex-end",
  },
});
