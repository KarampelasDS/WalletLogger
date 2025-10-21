import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Store } from "../../stores/Store";
import { Ionicons } from "@expo/vector-icons";
import Button from "../../components/Button/Button";
import { useRouter } from "expo-router";
import { useState } from "react";
import Toast from "react-native-toast-message";
import DragList from "react-native-draglist";

export default function SetupScreen3() {
  const router = useRouter();
  const setShowNavbar = Store((state) => state.setShowNavbar);
  const iconSize = Store((state) => state.iconSize);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const [incomeCategories, setIncomeCategories] = useState([
    { id: "1", name: "Salary", emoji: "💼" },
    { id: "2", name: "Business", emoji: "🏢" },
    { id: "3", name: "Investments", emoji: "📈" },
    { id: "4", name: "Gift", emoji: "🎁" },
    { id: "5", name: "Freelance", emoji: "🖥️" },
    { id: "6", name: "Rental Income", emoji: "🏠" },
    { id: "7", name: "Savings Withdrawals cause im gay", emoji: "🏦" },
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

    // delete handler
    const handleDelete = (id) => {
      setIncomeCategories((prev) => prev.filter((cat) => cat.id !== id));
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
            onPress={() => console.log("Edit", item.id)}
            style={{ paddingVertical: 10 }}
            activeOpacity={0.9}
          >
            <Ionicons name="create-outline" size={30} color="#aaa" />
          </TouchableOpacity>

          {/* Drag Button */}
          <TouchableOpacity
            style={{ paddingVertical: 10 }}
            activeOpacity={0.9}
            onLongPress={() => {
              setScrollEnabled(false);
              onDragStart();
            }}
            onPressOut={() => onDragEnd()}
            onPress={() => {
              onDragEnd();
              setScrollEnabled(true);
            }}
          >
            <Ionicons name="menu" size={30} color="#aaa" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  async function onReordered(fromIndex, toIndex) {
    const copy = [...incomeCategories];
    setScrollEnabled(true);
    const removed = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, removed[0]);
    setIncomeCategories(copy);
  }

  setShowNavbar(false);

  return (
    <View style={styles.container}>
      <Text style={styles.introText}>Set up your Income Categories</Text>
      <Text style={styles.introSubText}>You can always change these later</Text>

      <View style={styles.listContainer}>
        <DragList
          data={incomeCategories}
          keyExtractor={keyExtractor}
          onReordered={onReordered}
          renderItem={renderItem}
          scrollEnabled={scrollEnabled}
        />
      </View>

      <View style={styles.buttons}>
        <Button enabled={true}>Next</Button>
      </View>
    </View>
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
    height: "70%",
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
  },
});
