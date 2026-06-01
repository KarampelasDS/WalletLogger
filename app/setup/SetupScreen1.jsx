import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Store } from "../../stores/Store";
import Button from "../../components/Button/Button";
import { useRouter } from "expo-router";

export default function SetupScreen1() {
  const router = useRouter();
  const setShowNavbar = Store((state) => state.setShowNavbar);
  const initDB = Store((state) => state.initDB);
  const dbInitialized = Store((state) => state.dbInitialized);

  const [loading, setLoading] = useState(true);

  setShowNavbar(false);

  useEffect(() => {
    const initialize = async () => {
      if (!dbInitialized) {
        await initDB();
        console.log("✅ Database initialized!");
      }
      setLoading(false);
    };
    initialize();
  }, [dbInitialized, initDB]);

  return (
    <View style={styles.container}>
      <View style={styles.logoTile}>
        <Ionicons name="wallet" size={116} color="#fff" />
      </View>
      <Text style={styles.introText}>Welcome to Wallet Logger</Text>
      <Text style={styles.introSubText}>Your all-in-one expense manager!</Text>

      <View style={styles.buttons}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#fff"
            style={{ marginTop: 20 }}
          />
        ) : (
          <Button
            enabled={!loading}
            function={() => router.replace("/setup/SetupScreen2")}
            backgroundColor={"#2C2E42"}
            disabledColor={"#33343fff"}
          >
            Get Started!
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", flex: 1 },
  logoTile: {
    width: 168,
    height: 168,
    borderRadius: 42,
    backgroundColor: "#734BE9",
    alignItems: "center",
    justifyContent: "center",
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
    marginBottom: 24,
    width: "80%",
  },
});
