import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Store } from "../../stores/Store";
import { Ionicons } from "@expo/vector-icons";
import Button from "../../components/Button/Button";
import { useRouter } from "expo-router";
import { useState } from "react";
import DragList from "react-native-draglist";
import InputModal from "../../components/InputModal/InputModal";
import Toast from "react-native-toast-message";

export default function SetupScreen3() {
  const router = useRouter();
  const setShowNavbar = Store((state) => state.setShowNavbar);
  const iconSize = Store((state) => state.iconSize);
  const [showEditModal, setShowEditModal] = useState(false);

  const [modalMode, setModalMode] = useState("edit");
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryEmoji, setCategoryEmoji] = useState("");

  const [incomeCategories, setIncomeCategories] = useState([
    { id: "1", name: "Salary", emoji: "💼" },
    { id: "2", name: "Business", emoji: "🏢" },
    { id: "3", name: "Investments", emoji: "📈" },
    { id: "4", name: "Gift", emoji: "🎁" },
    { id: "5", name: "Freelance", emoji: "🖥️" },
    { id: "6", name: "Rental Income", emoji: "🏠" },
    { id: "7", name: "Savings Withdrawals", emoji: "🏦" },
    { id: "8", name: "Bonus", emoji: "🎉" },
    { id: "9", name: "Refund", emoji: "💸" },
    { id: "10", name: "Allowance", emoji: "💰" },
    { id: "11", name: "Other", emoji: "🤑" },
  ]);

  function keyExtractor(item) {
    return item.id;
  }

  function renderItem(info) {
    const { item, onDragStart, onDragEnd, isActive } = info;

    const handleDelete = (id) => {
      setIncomeCategories((prev) => prev.filter((cat) => cat.id !== id));
    };

    const handleEdit = (cat) => {
      setModalMode("edit");
      setEditingCategoryId(cat.id);
      setCategoryName(cat.name);
      setCategoryEmoji(cat.emoji);
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
          <Text
            style={[styles.itemName, { maxWidth: 120 }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.name}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 15 }}>
          {/* Delete Button */}
          <TouchableOpacity
            onPress={() => handleDelete(item.id)}
            style={{ paddingVertical: 10 }}
            activeOpacity={0.9}
          >
            <Ionicons name="close-outline" size={30} color="#ff5c5c" />
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
            onPress={() => {
              onDragEnd();
            }}
            onPressIn={() => {
              onDragStart();
            }}
            onPressOut={() => {
              onDragEnd();
            }}
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
    setShowEditModal(true);
    setEditingCategoryId(null);
  }

  async function onReordered(fromIndex, toIndex) {
    const copy = [...incomeCategories];
    const removed = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, removed[0]);
    setIncomeCategories(copy);
  }

  setShowNavbar(false);

  function getNextId() {
    if (incomeCategories.length === 0) {
      return "1";
    }
    const maxId = Math.max(
      ...incomeCategories.map((cat) => parseInt(cat.id, 10))
    );
    return String(maxId + 1);
  }

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.introText}>Configure your</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Text style={[styles.introText, { color: "#4EA758" }]}>Income</Text>
          <Text style={styles.introText}>Categories</Text>
        </View>

        <Text style={styles.introSubText}>
          You can always change these later
        </Text>

        <View style={styles.listContainer}>
          <DragList
            data={incomeCategories}
            keyExtractor={keyExtractor}
            onReordered={onReordered}
            renderItem={renderItem}
          />
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAdd}
          activeOpacity={0.92}
        >
          <Ionicons name="add-circle-outline" size={32} color="#fff" />
          <Text style={styles.addText}>Add Category</Text>
        </TouchableOpacity>

        <View style={styles.buttons}>
          <Button
            enabled={incomeCategories.length >= 1}
            backgroundColor={"#2C2E42"}
            disabledColor={"#33343fff"}
            functionDisabled={() => {
              Toast.show({
                type: "error",
                text1: "Error",
                text2:
                  "Make sure you have at least one category before continuing",
              });
            }}
            function={() => {
              router.push("/setup/SetupScreen4");
            }}
          >
            Next
          </Button>
        </View>
      </View>
      {showEditModal && (
        <InputModal
          title={modalMode === "add" ? "Add Category" : "Edit Category"}
          categoryName={categoryName}
          categoryEmoji={categoryEmoji}
          onSave={(newName, newEmoji) => {
            if (modalMode === "add") {
              // Add new category with unique id
              const newCat = {
                id: getNextId(),
                name: newName,
                emoji: newEmoji,
              };
              setIncomeCategories((cats) => [...cats, newCat]);
            } else {
              // Edit mode: update category
              setIncomeCategories((cats) =>
                cats.map((cat) =>
                  cat.id === editingCategoryId
                    ? { ...cat, name: newName, emoji: newEmoji }
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
    paddingTop: 60,
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
    marginBottom: 20,
    textAlign: "center",
  },
  listContainer: {
    width: "85%",
    marginTop: 10,
    height: "62%",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2C2E42",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 15,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 2,
    gap: 8,
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
  itemEmoji: {
    fontSize: 22,
    marginRight: 10,
  },
  itemName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "500",
  },
  buttons: {
    position: "absolute",
    bottom: 0,
    marginBottom: 50,
    width: "80%",
  },
});
