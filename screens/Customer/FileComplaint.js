import React, { useState } from "react";
import { View, Text, TextInput, Button, Image, TouchableOpacity, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { uploadImageToFirebase, submitComplaint } from "../../complaintService";

const FileComplaintScreen = ({ route, navigation }) => {
  const { orderId, providerId } = route.params;
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    const imageUrl = image ? await uploadImageToFirebase(image) : null;
    await submitComplaint(orderId, providerId, description, imageUrl);
    alert("Complaint submitted!");
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>File a Complaint</Text>

      <Text style={styles.label}>Describe your issue:</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="Enter details..."
        multiline
      />

      <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
        <Text style={styles.uploadButtonText}>Upload Image</Text>
      </TouchableOpacity>

      {image && <Image source={{ uri: image }} style={styles.previewImage} />}

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Submit Complaint</Text>
      </TouchableOpacity>
    </View>
  );
};

export default FileComplaintScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#dc3545",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: "#fff",
    marginBottom: 15,
    textAlignVertical: "top",
    minHeight: 80,
  },
  uploadButton: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 15,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 10,
    alignSelf: "center",
    marginBottom: 15,
  },
  submitButton: {
    backgroundColor: "#28a745",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
