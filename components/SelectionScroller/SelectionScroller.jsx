import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";

export default function SelectionScroller(props) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ alignItems: "center" }}
    >
      {props.children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "80%",
    maxHeight: "70%",
    marginTop: 20,
  },
});
