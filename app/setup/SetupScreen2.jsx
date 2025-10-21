import { View, Text, StyleSheet } from "react-native";
import { Store } from "../../stores/Store";
import { Ionicons } from "@expo/vector-icons";
import Button from "../../components/Button/Button";
import { useRouter } from "expo-router";
import SelectionScroller from "../../components/SelectionScroller/SelectionScroller";
import ScrollerOption from "../../components/SelectionScroller/ScrollerOption";
import { useState } from "react";
import Toast from "react-native-toast-message";

export default function SetupScreen2() {
  const router = useRouter();
  const setShowNavbar = Store((state) => state.setShowNavbar);
  const iconSize = Store((state) => state.iconSize);

  const [selectedCurrency, setSelectedCurrency] = useState(null);

  setShowNavbar(false);

  return (
    <View style={styles.container}>
      <Text style={styles.introText}>What is your main currency?</Text>
      <Text style={styles.introSubText}>You can always change this later</Text>
      <SelectionScroller>
        <ScrollerOption
          active={selectedCurrency == "Euro"}
          function={() => setSelectedCurrency("Euro")}
        >
          Euro
        </ScrollerOption>
        <ScrollerOption
          active={selectedCurrency == "US Dollar"}
          function={() => setSelectedCurrency("US Dollar")}
        >
          US Dollar
        </ScrollerOption>
        <ScrollerOption
          active={selectedCurrency == "British Pound"}
          function={() => setSelectedCurrency("British Pound")}
        >
          British Pound
        </ScrollerOption>
        <ScrollerOption
          active={selectedCurrency == "Japanese Yen"}
          function={() => setSelectedCurrency("Japanese Yen")}
        >
          Japanese Yen
        </ScrollerOption>
        <ScrollerOption
          active={selectedCurrency == "Canadian Dollar"}
          function={() => setSelectedCurrency("Canadian Dollar")}
        >
          Canadian Dollar
        </ScrollerOption>
        <ScrollerOption
          active={selectedCurrency == "Australian Dollar"}
          function={() => setSelectedCurrency("Australian Dollar")}
        >
          Australian Dollar
        </ScrollerOption>
        <ScrollerOption
          active={selectedCurrency == "Swiss Franc"}
          function={() => setSelectedCurrency("Swiss Franc")}
        >
          Swiss Franc
        </ScrollerOption>
        <ScrollerOption
          active={selectedCurrency == "Chinese Yuan"}
          function={() => setSelectedCurrency("Chinese Yuan")}
        >
          Chinese Yuan
        </ScrollerOption>
        <ScrollerOption
          active={selectedCurrency == "Indian Rupee"}
          function={() => setSelectedCurrency("Indian Rupee")}
        >
          Indian Rupee
        </ScrollerOption>
        <ScrollerOption
          active={selectedCurrency == "Mexican Peso"}
          function={() => setSelectedCurrency("Mexican Peso")}
        >
          Mexican Peso
        </ScrollerOption>
      </SelectionScroller>
      <View style={styles.buttons}>
        <Button
          functionDisabled={() => {
            Toast.show({
              type: "error",
              text1: "Make sure you select a currency before continuing",
            });
          }}
          function={() => {
            router.push("/setup/SetupScreen3");
          }}
          enabled={selectedCurrency != null}
        >
          Next
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "start", flex: 1 },
  intro: {
    backgroundColor: "#2C2E42",
    padding: 20,
    borderRadius: 20,
  },
  introText: {
    color: "#fff",
    fontSize: 30,
    textAlign: "center",
    marginTop: "10%",
  },
  introSubText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
  buttons: {
    position: "absolute",
    bottom: 0,
    marginBottom: 50,
  },
});
