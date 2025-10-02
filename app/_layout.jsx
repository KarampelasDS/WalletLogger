import { Slot } from "expo-router";
import NavBar from "../components/NavBar";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Dimensions } from "react-native";
import { Store } from "../stores/Store";

export default function Layout() {
  const setIconSize = Store((state) => state.setIconSize);
  const { width } = Dimensions.get("window");
  const iconSize = width * 0.07;
  setIconSize(iconSize);

  return (
    <>
      <StatusBar style="light" />
      <Slot />
      <NavBar />
    </>
  );
}
