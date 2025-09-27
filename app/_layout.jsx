import { Slot } from "expo-router";
import NavBar from "../components/NavBar";

export default function Layout() {
  return (
    <>
      <Slot />
      <NavBar />
    </>
  );
}
