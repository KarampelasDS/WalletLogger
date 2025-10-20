import { View, Text, StyleSheet } from "react-native";
import { Store } from "../../stores/Store";
import { Ionicons } from "@expo/vector-icons";
import Button from "../../components/Button/Button";
import { useRouter } from "expo-router";

export default function SetupScreen1() {
  const router = useRouter();
  const setShowNavbar = Store((state) => state.setShowNavbar);
  const iconSize = Store((state) => state.iconSize);
  setShowNavbar(false);

  return (
    <View style={styles.container}>
      <Ionicons
        style={styles.intro}
        name="wallet-outline"
        size={iconSize + 150}
        color="#fff"
      />
      <Text style={styles.introText}>Welcome to Wallet Logger</Text>
      <Text style={styles.introSubText}>Your all-in-one expense manager!</Text>
      <View style={styles.buttons}>
        <Button
          enabled={true}
          function={() => router.push("/setup/SetupScreen2")}
        >
          Get Started!
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", flex: 1 },
  intro: {
    backgroundColor: "#2C2E42",
    padding: 20,
    borderRadius: 20,
    marginTop: "-40%",
  },
  introText: {
    color: "#fff",
    fontSize: 30,
    textAlign: "center",
    marginTop: 50,
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
