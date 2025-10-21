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
import EmojiSelector, { Categories } from "react-native-emoji-selector";

export default function InputModal(props) {
  const [emoji, setEmoji] = useState(props.categoryEmoji || "😊");
  const [pickerVisible, setPickerVisible] = useState(false);
  const [categoryName, setCategoryName] = useState(props.categoryName || "");
  const isSaveAllowed =
    categoryName.trim().length > 0 && emoji.trim().length > 0;

  useEffect(() => {
    setEmoji(props.categoryEmoji || "😊");
    setCategoryName(props.categoryName || "");
  }, [props.categoryEmoji, props.categoryName]);

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
            <TouchableWithoutFeedback onPress={() => {}}>
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
                      placeholder="Category Name"
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    { opacity: isSaveAllowed ? 1 : 0.5 },
                  ]}
                  disabled={!isSaveAllowed}
                  onPress={() => props.onSave(categoryName, emoji)}
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
      {/* Emoji Picker Modal remains as before */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <TouchableOpacity onPress={() => setPickerVisible(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
          <EmojiSelector
            category={Categories.all}
            onEmojiSelected={(selectedEmoji) => {
              setEmoji(selectedEmoji);
              setPickerVisible(false);
            }}
            showTabs={true}
            showSearchBar={true}
            showHistory={true}
            columns={8}
            placeholder="Search emoji..."
          />
        </View>
      </Modal>
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
    zIndex: 100,
  },
  modal: {
    backgroundColor: "#1A1B25",
    width: "80%",
    paddingVertical: 20,
    borderRadius: 14,
    alignItems: "center",
    borderColor: "#fff",
    borderWidth: 2,
    minHeight: 260,
  },
  title: {
    borderBottomWidth: 1,
    borderBottomColor: "#d9d9d925",
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 8,
    paddingBottom: 10,
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
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: 36,
  },
  inputContainer: {
    borderBottomColor: "#d9d9d925",
    borderBottomWidth: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  emojiInput: {
    width: "19%",
    marginRight: 12,
  },
  nameInput: {
    width: "79%",
    marginLeft: 0,
  },
  inputText: {
    color: "white",
    fontSize: 24,
    textAlign: "left",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  saveButton: {
    backgroundColor: "#282A3B",
    borderRadius: 10,
    width: "90%",
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 24,
    letterSpacing: 1,
  },
  pickerContainer: {
    flex: 1,
    backgroundColor: "#1A1B25",
    paddingTop: 40,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  closeText: {
    color: "white",
    fontSize: 18,
  },
});
