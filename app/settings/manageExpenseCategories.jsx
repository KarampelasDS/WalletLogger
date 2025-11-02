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
import { useRouter } from "expo-router";
import DragList from "react-native-draglist";
import InputModal from "../../components/InputModal/InputModal";
import Toast from "react-native-toast-message";
import ConfirmModal from "../../components/ConfrimModal/ConfirmModal";

export default function ManageExpenseCategories() {
  const router = useRouter();
  const db = Store((state) => state.db);
  const setShowNavbar = Store((state) => state.setShowNavbar);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalMode, setModalMode] = useState("edit");
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryEmoji, setCategoryEmoji] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  setShowNavbar(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await db.getAllAsync(
          "SELECT * FROM categories WHERE category_type = 'Expense' ORDER BY category_order ASC"
        );
        setCategories(data);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        Toast.show({ type: "error", text1: "Error loading categories" });
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  function keyExtractor(item) {
    return item.category_id.toString();
  }

  function renderItem(info) {
    const { item, onDragStart, onDragEnd, isActive } = info;

    const handleDeletePress = (cat) => {
      setCategoryToDelete(cat);
      setShowDeleteModal(true);
    };

    const handleEdit = (cat) => {
      setModalMode("edit");
      setEditingCategoryId(cat.category_id);
      setCategoryName(cat.category_name);
      setCategoryEmoji(cat.category_emoji);
      setShowEditModal(true);
    };

    return (
      <View
        key={item.category_id}
        style={[
          styles.item,
          isActive && {
            backgroundColor: "#393B50",
            transform: [{ scale: 1.03 }],
          },
        ]}
      >
        <View style={styles.itemLeft}>
          <Text style={styles.itemEmoji}>{item.category_emoji}</Text>
          <Text style={[styles.itemName, { maxWidth: 120 }]} numberOfLines={1}>
            {item.category_name}
          </Text>
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
  }

  async function onReordered(fromIndex, toIndex) {
    const copy = [...categories];
    const removed = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, removed[0]);
    setCategories(copy);

    try {
      for (let i = 0; i < copy.length; i++) {
        await db.runAsync(
          "UPDATE categories SET category_order = ? WHERE category_id = ?",
          [i, copy[i].category_id]
        );
      }
    } catch (err) {
      console.error("Reorder error:", err);
    }
  }

  function handleAdd() {
    setModalMode("add");
    setCategoryName("");
    setCategoryEmoji("💸");
    setShowEditModal(true);
    setEditingCategoryId(null);
  }

  async function handleSave(newName, newEmoji) {
    try {
      if (modalMode === "add") {
        await db.runAsync(
          "INSERT INTO categories (category_name, category_emoji, category_type, category_order) VALUES (?, ?, 'Expense', ?)",
          [newName, newEmoji, categories.length]
        );
        Toast.show({ type: "success", text1: "Added Category" });
      } else {
        await db.runAsync(
          "UPDATE categories SET category_name = ?, category_emoji = ? WHERE category_id = ?",
          [newName, newEmoji, editingCategoryId]
        );
        Toast.show({ type: "success", text1: "Edited Category" });
      }

      const data = await db.getAllAsync(
        "SELECT * FROM categories WHERE category_type = 'Expense' ORDER BY category_order ASC"
      );
      setCategories(data);
      setShowEditModal(false);
      setEditingCategoryId(null);
      setModalMode("edit");
    } catch (err) {
      console.error("Save error:", err);
      Toast.show({ type: "error", text1: "Failed to save changes" });
    }
  }

  const confirmDelete = async () => {
    try {
      await db.runAsync("DELETE FROM categories WHERE category_id = ?", [
        categoryToDelete.category_id,
      ]);
      setCategories((prev) =>
        prev.filter((cat) => cat.category_id !== categoryToDelete.category_id)
      );
      Toast.show({ type: "error", text1: "Deleted Category" });
    } catch (err) {
      console.error("Delete error:", err);
      Toast.show({ type: "error", text1: "Failed to delete category" });
    } finally {
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    }
  };

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.introText}>Manage your</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Text style={[styles.introText, { color: "#CD5D5D" }]}>Expense</Text>
          <Text style={styles.introText}>Categories</Text>
        </View>
        <Text style={styles.introSubText}>Add, edit or delete categories</Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#734BE9"
            style={{ marginTop: 50 }}
          />
        ) : (
          <View style={styles.listContainer}>
            <DragList
              data={categories}
              keyExtractor={keyExtractor}
              onReordered={onReordered}
              renderItem={renderItem}
            />
          </View>
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAdd}
          activeOpacity={0.92}
        >
          <Ionicons name="add-circle-outline" size={32} color="#fff" />
          <Text style={styles.addText}>Add Category</Text>
        </TouchableOpacity>
      </View>

      {showEditModal && (
        <InputModal
          title={modalMode === "add" ? "Add Category" : "Edit Category"}
          categoryName={categoryName}
          categoryEmoji={categoryEmoji}
          onSave={handleSave}
          onClose={() => {
            setShowEditModal(false);
            setEditingCategoryId(null);
            setModalMode("edit");
          }}
        />
      )}

      {categoryToDelete && (
        <ConfirmModal
          visible={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
          itemName={categoryToDelete.category_name}
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
    paddingTop: 30,
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
});
