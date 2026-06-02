import { View, StyleSheet, ScrollView, Dimensions } from "react-native";
import KeyboardHeader from "../KeyboardHeader/KeyboardHeader";
import Option from "./Option";
import { useRouter } from "expo-router";
import { Store } from "../../stores/Store";

const { height: screenHeight } = Dimensions.get("window");
const pickerHeight = Math.round(screenHeight * 0.41);

export default function OptionPicker(props) {
  const router = useRouter();
  const setShowNavbar = Store((state) => state.setShowNavbar);

  const word =
    props.type === "Account"
      ? "account"
      : props.type === "Currencies"
      ? "currency"
      : "category";

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.container} onStartShouldSetResponder={() => true}>
        {props.headerText && (
          <KeyboardHeader
            text={props.headerText}
            backgroundColor={props.headerBackgroundColor}
          />
        )}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.options}
          showsVerticalScrollIndicator={true}
        >
          {props.options?.map((option) => (
            <Option
              key={option[`${word}_id`]}
              emoji={option[`${word}_emoji`]}
              name={option[`${word}_name`]}
              id={option[`${word}_id`]}
              symbol={option[`${word}_symbol`]}
              conversion_rate_to_main={option["conversion_rate_to_main"]}
              valueUpdateFunction={props.valueUpdateFunction}
            />
          ))}
          {props.type === "Currencies" && (
            <Option
              name="Manage Currencies"
              emoji="🪙"
              valueUpdateFunction={() => {
                setShowNavbar(true);
                router.push("/settings/manageCurrencies");
              }}
            />
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1002,
  },
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: pickerHeight,
    backgroundColor: "#1A1B25",
    zIndex: 1002,
    overflow: "hidden",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  scrollArea: {
    flex: 1,
    width: "100%",
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    padding: 4,
  },
});
