import { Text, StyleSheet } from "react-native";

export default function Title(props) {
  return <Text style={styles.title}>{props.title}</Text>;
}

const styles = StyleSheet.create({
  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "bold",
    position: "absolute",
    top: "5%",
    textAlign: "left",
    left: "5%",
    borderBottomColor: "#fff",
    borderBottomWidth: 2,
    paddingBottom: 5,
    width: "90%",
  },
});
