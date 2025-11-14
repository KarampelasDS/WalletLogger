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
      style={[
        styles.container,
        { maxHeight: props.maxHeight ? `${props.maxHeight}%` : "70%" },
      ]}
      contentContainerStyle={{ alignItems: "center" }}
    >
      {props.children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "80%",
    marginTop: 10,
  },
});
