import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Store } from "../../stores/Store";
import { useEffect, useState } from "react";

export default function TransactionDay(props) {
  const [transactions, setTransactions] = useState([]);

  return (
    <View>
      <Text>{props.type}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
});
