import { Slot } from "expo-router";
import NavBar from "../components/NavBar";
import { View } from "react-native";
import { Dimensions, StyleSheet } from "react-native";
import { Store } from "../stores/Store";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";

export default function Layout() {
  const setIconSize = Store((state) => state.setIconSize);
  const ZustandShowNavbar = Store((state) => state.showNavbar);
  const completedSetup = Store((state) => state.completedSetup);
  const { width, height } = Dimensions.get("window");
  const iconSize = width * 0.07;
  const setDimensions = Store((state) => state.setDimensions);

  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  async function setupNavigationBar() {
    try {
      await NavigationBar.setVisibilityAsync("hidden");
      await NavigationBar.setBehaviorAsync("overlay-swipe");
    } catch (e) {
      console.log(e);
    }
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIconSize(iconSize);
  }, [iconSize, setIconSize]);

  useEffect(() => {
    setDimensions(width, height);
    setupNavigationBar();
  }, []);

  useEffect(() => {
    if (mounted && !completedSetup) {
      router.replace("/setup/SetupScreen1");
    }
  }, [mounted, completedSetup, router]);

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
