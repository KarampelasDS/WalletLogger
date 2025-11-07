import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Store } from "../../stores/Store";
import { Ionicons } from "@expo/vector-icons";
import Button from "../../components/Button/Button";
import { useRouter } from "expo-router";
import { useState } from "react";
import DragList from "react-native-draglist";
import InputModal from "../../components/InputModal/InputModal";
import Toast from "react-native-toast-message";

export default function SetupScreen5() {
  const router = useRouter();
  const setShowNavbar = Store((state) => state.setShowNavbar);
  const mainCurrency = Store((state) => state.mainCurrency);

  const [showEditModal, setShowEditModal] = useState(false);
  const [modalMode, setModalMode] = useState("edit");
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryEmoji, setCategoryEmoji] = useState("");
  const [categoryBalance, setCategoryBalance] = useState("0");

  const setSetupAccounts = Store((state) => state.setSetupAccounts);

  const [accounts, setAccounts] = useState([
    { id: "1", name: "Bank", emoji: "🏦", balance: "0" },
    { id: "2", name: "Cash", emoji: "💵", balance: "0" },
  ]);

  function keyExtractor(item) {
    return item.id;
  }

  function renderItem(info) {
    const { item, onDragStart, onDragEnd, isActive } = info;

    const handleDelete = (id) => {
      setAccounts((prev) => prev.filter((cat) => cat.id !== id));
    };

    const handleEdit = (cat) => {
      setModalMode("edit");
      setEditingCategoryId(cat.id);
      setCategoryName(cat.name);
      setCategoryEmoji(cat.emoji);
      setCategoryBalance(String(cat.balance));
      setShowEditModal(true);
    };

    return (
      <View
        key={item.id}
        style={[
          styles.item,
          isActive && {
            backgroundColor: "#393B50",
            transform: [{ scale: 1.03 }],
          },
        ]}
      >
        <View style={styles.itemLeft}>
          <Text style={styles.itemEmoji}>{item.emoji}</Text>
          <View>
            <Text
              style={[styles.itemName, { maxWidth: 140 }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.name}
            </Text>
            <Text style={styles.balanceText}>
              {Number(item.balance).toLocaleString("en-US", {
                maximumFractionDigits: 2,
              })}{" "}
              {mainCurrency.symbol}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 15 }}>
          <TouchableOpacity
            onPress={() => handleDelete(item.id)}
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
            onPressIn={() => onDragStart()}
            onPressOut={() => onDragEnd()}
            onPress={() => onDragEnd()}
          >
            <Ionicons name="menu" size={30} color="#aaa" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function handleAdd() {
    setModalMode("add");
    setCategoryName("");
    setCategoryEmoji("😊");
    setCategoryBalance("0");
    setShowEditModal(true);
    setEditingCategoryId(null);
  }

  async function onReordered(fromIndex, toIndex) {
    const copy = [...accounts];
    const removed = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, removed[0]);
    setAccounts(copy);
  }

  setShowNavbar(false);

  function getNextId() {
    if (accounts.length === 0) return "1";
    const maxId = Math.max(...accounts.map((cat) => parseInt(cat.id, 10)));
    return String(maxId + 1);
  }

  return (
    <>
      <View style={styles.container}>
        <View style={styles.topBlock}>
          <Text style={styles.introText}>Configure your Accounts</Text>
          <Text style={styles.introSubText}>
            You can set an initial balance for each
          </Text>
        </View>
        <View style={styles.listContainer}>
          <DragList
            data={accounts}
            keyExtractor={keyExtractor}
            onReordered={onReordered}
            renderItem={renderItem}
          />
        </View>
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAdd}
            activeOpacity={0.92}
          >
            <Ionicons name="add-circle-outline" size={32} color="#fff" />
            <Text style={styles.addText}>Add Account</Text>
          </TouchableOpacity>
          <Button
            enabled={accounts.length >= 1}
            backgroundColor={"#2C2E42"}
            disabledColor={"#33343fff"}
            functionDisabled={() =>
              Toast.show({
                type: "error",
                text1: "Error",
                text2:
                  "Make sure you have at least one account before continuing",
              })
            }
            function={() => {
              setSetupAccounts(accounts);
              router.replace("/setup/SetupScreen6");
            }}
          >
            Next
          </Button>
        </View>
      </View>
      {showEditModal && (
        <InputModal
          title={modalMode === "add" ? "Add Account" : "Edit Account"}
          categoryName={categoryName}
          categoryEmoji={categoryEmoji}
          categoryBalance={categoryBalance}
          modalMode={"add"}
          accountMode={true}
          onSave={(newName, newEmoji, newBalance) => {
            if (modalMode === "add") {
              const newAcc = {
                id: getNextId(),
                name: newName,
                emoji: newEmoji,
                balance: newBalance || "0",
              };
              setAccounts((cats) => [...cats, newAcc]);
            } else {
              setAccounts((cats) =>
                cats.map((cat) =>
                  cat.id === editingCategoryId
                    ? {
                        ...cat,
                        name: newName,
                        emoji: newEmoji,
                        balance: newBalance || "0",
                      }
                    : cat
                )
              );
            }
            setShowEditModal(false);
            setEditingCategoryId(null);
            setModalMode("edit");
          }}
          onClose={() => {
            setShowEditModal(false);
            setEditingCategoryId(null);
            setModalMode("edit");
          }}
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
    paddingTop: 60,
    justifyContent: "flex-end", // pin the buttons section to the bottom
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
    marginTop: 10,
    marginBottom: 10,
    textAlign: "center",
  },
  listContainer: {
    width: "85%",
    flex: 1,
    alignSelf: "center",
    marginBottom: 6,
    marginTop: 5,
  },
  addButton: {
    width: 200,
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
    marginBottom: 12,
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
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
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
    marginBottom: 24,
    gap: 10,
    justifyContent: "flex-end",
  },
});
