import { View, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Store } from "../../stores/Store";

export default function Keyboard(props) {
  const iconSize = Store((state) => state.iconSize);

  return (
    <View style={styles.container}>
      <View>
        <Text
          style={[
            styles.keyboardHeader,
            { backgroundColor: `${props.typeColor}` },
          ]}
        >
          {props.headerText}
        </Text>
      </View>
      <View>
        <View style={styles.keyboardRow}>
          <View
            style={[
              styles.keyboardButton,
              {
                borderRightWidth: 2,
                borderRightColor: "#d9d9d925",
                borderBottomColor: "#d9d9d925",
                borderBottomWidth: 2,
                padding: 20,
              },
            ]}
          >
            <Text style={styles.keyboardButtonText}>1</Text>
          </View>
          <View
            style={[
              styles.keyboardButton,
              {
                borderRightWidth: 2,
                borderRightColor: "#d9d9d925",
                borderBottomColor: "#d9d9d925",
                borderBottomWidth: 2,
                padding: 20,
              },
            ]}
          >
            <Text style={styles.keyboardButtonText}>2</Text>
          </View>
          <View
            style={[
              styles.keyboardButton,
              {
                borderBottomColor: "#d9d9d925",
                borderBottomWidth: 2,
                padding: 20,
              },
            ]}
          >
            <Text style={styles.keyboardButtonText}>3</Text>
          </View>
          <View
            style={[
              styles.keyboardButton,
              {
                borderBottomColor: "#d9d9d925",
                borderBottomWidth: 2,
                borderLeftColor: "#d9d9d925",
                borderLeftWidth: 2,
                padding: 20,
              },
            ]}
          >
            <Ionicons name="backspace" size={iconSize} color="#fff" />
          </View>
        </View>
        <View style={styles.keyboardRow}>
          <View
            style={[
              styles.keyboardButton,
              {
                borderRightWidth: 2,
                borderRightColor: "#d9d9d925",
                borderBottomColor: "#d9d9d925",
                borderBottomWidth: 2,
                padding: 20,
              },
            ]}
          >
            <Text style={styles.keyboardButtonText}>4</Text>
          </View>
          <View
            style={[
              styles.keyboardButton,
              {
                borderRightWidth: 2,
                borderRightColor: "#d9d9d925",
                borderBottomColor: "#d9d9d925",
                borderBottomWidth: 2,
                padding: 20,
              },
            ]}
          >
            <Text style={styles.keyboardButtonText}>5</Text>
          </View>
          <View
            style={[
              styles.keyboardButton,
              {
                borderBottomColor: "#d9d9d925",
                borderBottomWidth: 2,
                padding: 20,
              },
            ]}
          >
            <Text style={styles.keyboardButtonText}>6</Text>
          </View>
          <View
            style={[
              styles.keyboardButton,
              {
                borderBottomColor: "#d9d9d925",
                borderBottomWidth: 2,
                borderLeftColor: "#d9d9d925",
                borderLeftWidth: 2,
                padding: 20,
              },
            ]}
          >
            <Ionicons name="cash" size={iconSize} color="#fff" />
          </View>
        </View>
        <View style={styles.keyboardRow}>
          <View
            style={[
              styles.keyboardButton,
              {
                borderRightWidth: 2,
                borderRightColor: "#d9d9d925",
                borderBottomColor: "#d9d9d925",
                borderBottomWidth: 2,
                padding: 20,
              },
            ]}
          >
            <Text style={styles.keyboardButtonText}>7</Text>
          </View>
          <View
            style={[
              styles.keyboardButton,
              {
                borderRightWidth: 2,
                borderRightColor: "#d9d9d925",
                borderBottomColor: "#d9d9d925",
                borderBottomWidth: 2,
                padding: 20,
              },
            ]}
          >
            <Text style={styles.keyboardButtonText}>8</Text>
          </View>
          <View
            style={[
              styles.keyboardButton,
              {
                borderBottomColor: "#d9d9d925",
                borderBottomWidth: 2,
                padding: 20,
              },
            ]}
          >
            <Text style={styles.keyboardButtonText}>9</Text>
          </View>
          <View
            style={[
              styles.keyboardButton,
              {
                borderBottomColor: "#d9d9d925",
                borderBottomWidth: 2,
                borderLeftColor: "#d9d9d925",
                borderLeftWidth: 2,
                padding: 20,
              },
            ]}
          >
            <Ionicons name="calculator" size={iconSize} color="#fff" />
          </View>
        </View>
        <View style={styles.keyboardRow}>
          <View
            style={[
              styles.keyboardButton,
              {
                borderRightWidth: 2,
                borderRightColor: "#d9d9d925",
                borderBottomColor: "#d9d9d925",
                borderBottomWidth: 2,
                padding: 20,
              },
            ]}
          >
            <Ionicons name="trash" size={iconSize} color="#fff" />
          </View>
          <View
            style={[
              styles.keyboardButton,
              {
                borderRightWidth: 2,
                borderRightColor: "#d9d9d925",
                borderBottomColor: "#d9d9d925",
                borderBottomWidth: 2,
                padding: 20,
              },
            ]}
          >
            <Text style={styles.keyboardButtonText}>0</Text>
          </View>
          <View
            style={[
              styles.keyboardButton,
              {
                borderBottomColor: "#d9d9d925",
                borderBottomWidth: 2,
                padding: 20,
              },
            ]}
          >
            <Text style={styles.keyboardButtonText}>.</Text>
          </View>
          <View
            style={[
              styles.keyboardButton,
              {
                borderBottomColor: "#d9d9d925",
                borderBottomWidth: 2,
                borderLeftColor: "#d9d9d925",
                borderLeftWidth: 2,
                padding: 20,
              },
            ]}
          >
            <Text style={[styles.keyboardButtonText, { fontSize: 18 }]}>
              Done
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#363642",
  },
  keyboardHeader: {
    color: "white",
    fontSize: 20,
    padding: 12,
    textAlign: "center",
    borderTopColor: "#fff",
    borderTopWidth: 2,
    borderBottomColor: "#fff",
    borderBottomWidth: 2,
  },
  keyboardRow: {
    flexDirection: "row",
  },
  keyboardButton: {
    padding: 20,
    minWidth: "25%",
    textAlign: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  keyboardButtonText: {
    color: "#fff",
    fontSize: 24,
  },
  keyboardCol: {
    flexDirection: "column",
  },
});
