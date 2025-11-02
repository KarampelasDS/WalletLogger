import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { Store } from "../stores/Store";
const { width, height } = Dimensions.get("window");

export default function NavBar() {
  const router = useRouter();
  const pathName = usePathname();
  const iconSize = Store((state) => state.iconSize);

  return (
    <View style={styles.NavBar}>
      <TouchableOpacity
        style={styles.NavBarItem}
        onPress={() => (pathName == "/" ? "" : router.push("/"))}
      >
        <Ionicons name="book" size={iconSize} color="#fff" />
        <Text style={{ color: "#fff" }}>History</Text>
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
        onPress={() => router.push("/accounts")}
      >
        <Ionicons name="layers" size={iconSize} color="#fff" />
        <Text style={{ color: "#fff" }}>Accounts</Text>
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
    paddingBottom: "2%",
    flex: 1,
    flexDirection: "row",
    width: "100%",
    justifyContent: "center",
    height: "10%",
    alignItems: "center",
    paddingRight: "10%",
    paddingLeft: "10%",
    gap: "15%",
    borderTopWidth: 2,
    borderTopColor: "#fff",
  },
  NavBarItem: {
    alignItems: "center",
  },
});
