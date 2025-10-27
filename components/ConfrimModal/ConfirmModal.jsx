import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";

export default function ConfirmModal({
  visible,
  onClose,
  onConfirm,
  itemName,
}) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.container}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modal}>
              <Text style={styles.title}>Confirm Deletion</Text>
              <Text style={styles.message}>
                Are you sure you want to delete{" "}
                <Text style={{ fontWeight: "700" }}>{itemName}</Text>?
              </Text>

              <View style={styles.buttonsContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={onConfirm}
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "80%",
    backgroundColor: "#1A1B25",
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "white",
    marginBottom: 10,
  },
  message: {
    fontSize: 18,
    color: "#ccc",
    textAlign: "center",
    marginBottom: 25,
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: 20,
  },
  cancelButton: {
    backgroundColor: "#31323A",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  cancelText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "#CD5D5D",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  deleteText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
