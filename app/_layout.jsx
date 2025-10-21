import { Slot } from "expo-router";
import NavBar from "../components/NavBar";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Dimensions, StyleSheet } from "react-native";
import { Store } from "../stores/Store";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect } from "react";
import Toast from "react-native-toast-message";

export default function Layout() {
  const setIconSize = Store((state) => state.setIconSize);
  const ZustandShowNavbar = Store((state) => state.showNavbar);
  const { width, height } = Dimensions.get("window");
  const iconSize = width * 0.07;
  const setDimensions = Store((state) => state.setDimensions);

  useEffect(() => {
    setIconSize(iconSize);
  }, [iconSize, setIconSize]);

  useEffect(() => {
    setDimensions(width, height);
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <Slot />
      </SafeAreaView>
      {ZustandShowNavbar && <NavBar />}
      <Toast />
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#1A1B25",
  },
});
