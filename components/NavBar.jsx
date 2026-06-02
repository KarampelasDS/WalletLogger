import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { Store } from "../stores/Store";

const ITEMS = [
  { label: "History", icon: "book", path: "/" },
  { label: "Statistics", icon: "pie-chart", path: "/statistics" },
  { label: "Accounts", icon: "layers", path: "/accounts" },
  { label: "Settings", icon: "cog", path: "/settings" },
];

const ACTIVE = "#A78BFA";
const INACTIVE = "#8E8FA3";

export default function NavBar() {
  const router = useRouter();
  const pathName = usePathname();
  const iconSize = Store((state) => state.iconSize);

  return (
    <View style={styles.NavBar}>
      {ITEMS.map((item) => {
        const active =
          item.path === "/"
            ? pathName === "/"
            : pathName.startsWith(item.path);
        const color = active ? ACTIVE : INACTIVE;
        return (
          <TouchableOpacity
            key={item.path}
            style={styles.NavBarItem}
            onPress={() => (pathName === item.path ? null : router.push(item.path))}
          >
            <View style={[styles.indicator, active && styles.indicatorActive]} />
            <Ionicons name={item.icon} size={iconSize} color={color} />
            <Text
              numberOfLines={1}
              style={[styles.label, { color }, active && styles.labelActive]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  NavBar: {
    backgroundColor: "#2C2E42",
    position: "absolute",
    bottom: 0,
    paddingBottom: "2%",
    paddingTop: "1%",
    flexDirection: "row",
    width: "100%",
    height: "10%",
    alignItems: "center",
    paddingHorizontal: 8,
    borderTopWidth: 2,
    borderTopColor: "#fff",
  },
  NavBarItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    marginHorizontal: 4,
    paddingVertical: 6,
  },
  indicator: {
    position: "absolute",
    top: -7,
    height: 3,
    width: "55%",
    borderRadius: 2,
    backgroundColor: "transparent",
  },
  indicatorActive: {
    backgroundColor: "#A78BFA",
  },
  label: {
    fontSize: 12,
  },
  labelActive: {
    fontWeight: "bold",
  },
});
