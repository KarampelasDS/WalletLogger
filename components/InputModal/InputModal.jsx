import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  Text,
  Modal,
} from "react-native";
import EmojiPicker from "rn-emoji-keyboard";

export default function InputModal(props) {
  const [emoji, setEmoji] = useState(props.categoryEmoji || "😊");
  const [pickerVisible, setPickerVisible] = useState(false);
  const [categoryName, setCategoryName] = useState(props.categoryName || "");
  const [balance, setBalance] = useState(props.categoryBalance || "");

  const isSaveAllowed =
    categoryName.trim().length > 0 &&
    emoji.trim().length > 0 &&
    (!props.accountMode || !isNaN(balance));

  useEffect(() => {
    setEmoji(props.categoryEmoji || "😊");
    setCategoryName(props.categoryName || "");
    setBalance(props.categoryBalance || "");
    if (props.categoryBalance < 0.01) setBalance("");
  }, [props.categoryEmoji, props.categoryName, props.categoryBalance]);

  const handleBalanceChange = (val) => {
    let str = val.replace(/[^0-9.]/g, "");
    if ((str.match(/\./g) || []).length > 1) return;
    if (str.includes(".") && str.split(".")[1].length > 2) return;
    if (str.length > 14 && !str.includes(".")) return;
    if (str.length > 17 && str.includes(".")) return;
    setBalance(str);
  };

  return (
    <>
      <Modal
        visible={true}
        animationType="fade"
        transparent={true}
        onRequestClose={props.onClose}
      >
        <TouchableWithoutFeedback onPress={props.onClose}>
          <View style={styles.container}>
            <TouchableWithoutFeedback>
              <View style={styles.modal}>
                <View style={styles.title}>
                  <Text style={styles.titleText}>{props.title}</Text>
                </View>

                <View style={styles.inputs}>
                  <TouchableOpacity
                    style={[styles.inputContainer, styles.emojiInput]}
                    onPress={() => setPickerVisible(true)}
                  >
                    <Text style={{ fontSize: 34 }}>{emoji}</Text>
                  </TouchableOpacity>

                  <View style={[styles.inputContainer, styles.nameInput]}>
                    <TextInput
                      placeholderTextColor="#bbb"
                      style={styles.inputText}
                      value={categoryName}
                      onChangeText={setCategoryName}
                      placeholder="Name"
                    />
                  </View>
                </View>

                {props.accountMode && props.modalMode === "add" && (
                  <View style={styles.balanceInput}>
                    <Text style={styles.balanceLabel}>Initial Balance:</Text>
                    <TextInput
                      keyboardType="numeric"
                      placeholderTextColor="#bbb"
                      style={[styles.inputText, { fontSize: 22 }]}
                      value={balance}
                      onChangeText={handleBalanceChange}
                      placeholder="0.00"
                      maxLength={17}
                    />
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    { opacity: isSaveAllowed ? 1 : 0.5 },
                  ]}
                  disabled={!isSaveAllowed}
                  onPress={() =>
                    props.onSave(
                      categoryName,
                      emoji,
                      props.accountMode ? balance : undefined
                    )
                  }
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ marginTop: 12 }}
                  onPress={props.onClose}
                >
                  <Text style={{ color: "#aaa", fontSize: 18 }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <EmojiPicker
        open={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onEmojiSelected={(emojiObject) => {
          setEmoji(emojiObject.emoji);
          setPickerVisible(false);
        }}
        enableSearchBar
        enableRecentlyUsed
        categoryPosition="bottom"
        theme={{
          backdrop: "rgba(0,0,0,0.6)",
          knob: "#fff",
          container: "#1A1B25",
          header: "#1A1B25",
          category: {
            icon: "#fff",
            iconActive: "#9ac9e3",
            container: "#1A1B25",
          },
          search: {
            text: "#fff",
            placeholder: "#aaa",
            icon: "#9ac9e3",
          },
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  modal: {
    backgroundColor: "#1A1B25",
    width: "80%",
    paddingVertical: 20,
    borderRadius: 14,
    alignItems: "center",
    borderColor: "#fff",
    borderWidth: 2,
    minHeight: 280,
  },
  title: {
    borderBottomWidth: 1,
    borderBottomColor: "#d9d9d925",
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 10,
  },
  titleText: {
    color: "white",
    fontSize: 32,
    fontWeight: "600",
    letterSpacing: 1,
  },
  inputs: {
    flexDirection: "row",
    gap: 10,
    width: "85%",
    alignItems: "center",
    marginBottom: 20,
  },
  balanceInput: {
    alignItems: "flex-start",
    width: "85%",
    marginBottom: 20,
    borderBottomColor: "#d9d9d925",
    borderBottomWidth: 1,
  },
  balanceLabel: {
    color: "#bbb",
    fontSize: 16,
    marginBottom: 6,
  },
  inputContainer: {
    borderBottomColor: "#d9d9d925",
    borderBottomWidth: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  emojiInput: { width: "19%", marginRight: 12 },
  nameInput: { width: "79%", marginLeft: 0 },
  inputText: {
    color: "white",
    fontSize: 22,
    paddingVertical: 6,
    paddingHorizontal: 8,
    width: "100%",
  },
  saveButton: {
    backgroundColor: "#9ac9e3",
    borderRadius: 10,
    width: "90%",
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  saveButtonText: {
    color: "#121325",
    fontWeight: "bold",
    fontSize: 22,
    letterSpacing: 1,
  },
});
