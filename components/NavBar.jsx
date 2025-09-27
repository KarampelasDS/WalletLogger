import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
const { width, height } = Dimensions.get("window");

export default function NavBar() {
  const router = useRouter();
  const iconSize = width < 800 ? width * 0.07 : width * 0.03;
  return (
    <View style={styles.NavBar}>
      <TouchableOpacity
        style={styles.NavBarItem}
        onPress={() => router.push("/")}
      >
        <Ionicons name="book" size={iconSize} color="#fff" />
        <Text style={{ color: "#fff" }}>Transactions</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.NavBarItem}
        onPress={() => router.push("/statistics")}
      >
        <Ionicons name="pie-chart" size={iconSize} color="#fff" />
        <Text style={{ color: "#fff" }}>Statistics</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.NavBarItem}
        onPress={() => router.push("/calendar")}
      >
        <Ionicons name="calendar" size={iconSize} color="#fff" />
        <Text style={{ color: "#fff" }}>Calendar</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.NavBarItem}
        onPress={() => router.push("/settings")}
      >
        <Ionicons name="cog" size={iconSize} color="#fff" />
        <Text style={{ color: "#fff" }}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  NavBar: {
    backgroundColor: "#2C2E42",
    position: "absolute",
    bottom: "0",
    marginBottom: "20",
    flex: 1,
    flexDirection: "row",
    width: "100%",
    justifyContent: "center",
    height: width < 800 ? "8%" : "15%",
    alignItems: "center",
    paddingRight: "15%",
    paddingLeft: "15%",
    gap: "15%",
  },
  NavBarItem: {
    alignItems: "center",
  },
});
