import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Store } from "../../stores/Store";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import DragList from "react-native-draglist";
import Toast from "react-native-toast-message";
import ConfirmModal from "../../components/ConfrimModal/ConfirmModal";

export default function ManageCurrencies() {
  const router = useRouter();
  const setShowNavbar = Store((state) => state.setShowNavbar);
  const iconSize = Store((state) => state.iconSize);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const db = Store((state) => state.db);

  const [userCurrencies, setUserCurrencies] = useState([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [currencyToDelete, setCurrencyToDelete] = useState(null);

  const fetchCurrencies = async () => {
    setShowNavbar(true);
    try {
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
      setUserCurrencies(currencies);
    } catch (e) {
      console.error("Failed to fetch user currencies:", e);
    }
  };

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const keyExtractor = (item) => item.currency_id.toString();

  const renderItem = ({ item, onDragStart, onDragEnd, isActive }) => {
    const requestDelete = (currency) => {
      setCurrencyToDelete(currency);
      setDeleteModalVisible(true);
    };

    return (
      <View
        key={item.currency_id}
        style={[
          styles.item,
          isActive && {
            backgroundColor: "#393B50",
            transform: [{ scale: 1.03 }],
          },
        ]}
      >
        <View style={styles.itemLeft}>
          <Text style={[styles.itemEmoji, { color: "#9ac9e3" }]}>
            {item.currency_symbol}
          </Text>
          <Text
            style={[styles.itemName, { maxWidth: 120 }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.currency_name}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 15 }}>
          {/* Delete Button */}
          <TouchableOpacity
            onPress={() => {
              if (item.is_main) {
                Toast.show({
                  type: "error",
                  text1: "Cannot delete main currency",
                  text2:
                    "Set another currency as main before deleting this one.",
                });
                return;
              }
              requestDelete(item);
            }}
            style={{ paddingVertical: 10 }}
            activeOpacity={0.9}
          >
            <Ionicons
              name="close-outline"
              size={30}
              color={item.is_main ? "#888" : "#ff5c5c"}
            />
          </TouchableOpacity>

          {/* Edit Button */}
          <TouchableOpacity
            onPress={() => handleEdit(item)}
            style={{ paddingVertical: 10 }}
            activeOpacity={0.9}
          >
            <Ionicons name="create-outline" size={30} color="#aaa" />
          </TouchableOpacity>

          {/* Drag Button */}
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

  const handleAdd = () => {
    router.push("/settings/addCurrency");
  };

  const handleDelete = async (id) => {
    try {
      await db.runAsync("DELETE FROM user_currencies WHERE currency_id = ?", [
        id,
      ]);
      setUserCurrencies((prev) => prev.filter((c) => c.currency_id !== id));
      Toast.show({
        type: "success",
        text1: "Deleted",
        text2: "Currency removed successfully.",
      });
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete currency.",
      });
      console.error("Delete currency error:", e);
    }
  };

  const handleConfirmDelete = async () => {
    if (!currencyToDelete) return;
    await handleDelete(currencyToDelete.currency_id);
    setDeleteModalVisible(false);
    setCurrencyToDelete(null);
  };

  const onReordered = async (fromIndex, toIndex) => {
    const copy = [...userCurrencies];
    const [movedItem] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, movedItem);
    setUserCurrencies(copy);

    try {
      for (let i = 0; i < copy.length; i++) {
        await db.runAsync(
          `UPDATE user_currencies SET display_order = ? WHERE currency_id = ?`,
          [i, copy[i].currency_id]
        );
      }
    } catch (e) {
      console.error("Failed to update currency order:", e);
      Toast.show({ type: "error", text1: "Failed to save order" });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.introText}>User Currencies</Text>

      <View style={styles.listContainer}>
        <DragList
          data={userCurrencies}
          keyExtractor={keyExtractor}
          onReordered={onReordered}
          renderItem={renderItem}
          scrollEnabled={scrollEnabled}
        />
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAdd}
        activeOpacity={0.92}
      >
        <Ionicons name="add-circle-outline" size={32} color="#fff" />
        <Text style={styles.addText}>Add Currency</Text>
      </TouchableOpacity>

      <ConfirmModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={handleConfirmDelete}
        itemName={currencyToDelete?.currency_name || ""}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1B25",
    alignItems: "center",
    paddingTop: 30,
  },
  introText: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
  },
  listContainer: { width: "85%", marginTop: 10, height: "62%" },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2C2E42",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 2,
    gap: 8,
    position: "absolute",
    bottom: 100,
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
});
