import { Text, StyleSheet, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Store } from "../../stores/Store";
import TotalAssets from "../TotalAssets/TotalAssets";

export default function Title(props) {
  const iconSize = Store((state) => state.iconSize);
  return (
    <View style={styles.title}>
      {props.backIcon && (
        <TouchableOpacity onPress={props.onPressBackIcon}>
          <Ionicons name={props.backIcon} size={iconSize} color="#fff" />
        </TouchableOpacity>
      )}
      <Text style={styles.titleText}>{props.title}</Text>
      {props.frontIcon && (
        <TouchableOpacity onPress={props.onPressFrontIcon}>
          <Ionicons name={props.frontIcon} size={iconSize} color="#fff" />
        </TouchableOpacity>
      )}
      <View style={styles.totalAssets}>
        <TotalAssets />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    width: "90%",
    borderBottomColor: "#fff",
    borderBottomWidth: 2,
    paddingBottom: 5,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 1000,
    paddingBottom: 5,
    marginBottom: 15,
  },
  titleText: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "left",
  },
  totalAssets: {
    marginLeft: "auto",
    marginRight: 10,
  },
});
