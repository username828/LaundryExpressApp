import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, firestore, app } from "../../firebaseConfig";
import * as ImagePicker from "expo-image-picker";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  SafeAreaView,
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import * as ImageManipulator from "expo-image-manipulator";

const SPAccountDetails = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cnic, setCnic] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;

      if (!currentUser) {
        Alert.alert("Error", "You must be logged in to view account details");
        setLoading(false);
        return;
      }

      const userDocRef = doc(firestore, "serviceProviders", currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        setName(userData.name || "");
        setEmail(userData.email || currentUser.email || "");
        setCnic(userData.cnic || "");
        setBusinessName(userData.businessName || "");
        setPhone(userData.phone || "");
        setLocation(userData.location || "");
        setProfilePicture(userData.profilePicture || "");
      } else {
        // If document doesn't exist, initialize with auth email
        setEmail(currentUser.email || "");
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      Alert.alert("Error", "Failed to load account details");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      // Request permission
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "We need camera roll permission to upload images"
        );
        return;
      }

      // Launch image picker with updated API
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const uploadImage = async (uri) => {
    try {
      setImageUploading(true);
      const currentUser = auth.currentUser;

      if (!currentUser) {
        Alert.alert("Error", "You must be logged in to upload images");
        return;
      }

      // Log the URI for debugging
      console.log("Image URI:", uri);

      // Convert image to base64 instead of blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Initialize storage with the app instance explicitly
      const storage = getStorage(app);

      // Use a simpler path
      const imagePath = `images/${currentUser.uid}_${Date.now()}.jpg`;
      console.log("Uploading to path:", imagePath);

      const storageRef = ref(storage, imagePath);

      // Add explicit content type
      const metadata = {
        contentType: "image/jpeg",
      };

      // Upload and log any errors in detail
      try {
        const snapshot = await uploadBytes(storageRef, blob, metadata);
        console.log("Upload successful:", snapshot);

        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log("Download URL:", downloadURL);

        setProfilePicture(downloadURL);
        Alert.alert("Success", "Profile picture uploaded successfully");
      } catch (uploadError) {
        console.error("Upload error details:", JSON.stringify(uploadError));
        throw uploadError;
      }
    } catch (error) {
      console.error("Error uploading image:", error);

      // Provide more detailed error information
      let errorMessage = "Failed to upload image.";
      if (error.code) {
        errorMessage += ` Error code: ${error.code}`;
      }
      if (error.message) {
        errorMessage += ` Message: ${error.message}`;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setImageUploading(false);
    }
  };

  const saveChanges = async () => {
    try {
      setSaving(true);
      const currentUser = auth.currentUser;

      if (!currentUser) {
        Alert.alert("Error", "You must be logged in to update account details");
        return;
      }

      // Validate required fields
      if (!name || !phone || !location || !businessName) {
        Alert.alert("Error", "Please fill in all required fields");
        return;
      }

      // Validate CNIC format (example: 12345-1234567-1)
      const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
      if (cnic && !cnicRegex.test(cnic)) {
        Alert.alert(
          "Error",
          "Please enter a valid CNIC in format: 12345-1234567-1"
        );
        return;
      }

      // Validate phone number (simple validation)
      const phoneRegex = /^\+?[0-9]{10,15}$/;
      if (!phoneRegex.test(phone)) {
        Alert.alert("Error", "Please enter a valid phone number");
        return;
      }

      const userDocRef = doc(firestore, "serviceProviders", currentUser.uid);

      await updateDoc(userDocRef, {
        name,
        email,
        cnic,
        businessName,
        phone,
        location,
        profilePicture,
        updatedAt: new Date(),
      });

      Alert.alert("Success", "Account details updated successfully");
    } catch (error) {
      console.error("Error updating account details:", error);
      Alert.alert("Error", "Failed to update account details");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Loading account details...</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View
            style={[
              styles.contentContainer,
              { paddingTop: insets.top > 0 ? 10 : 20 },
            ]}
          >
            <Text style={styles.title}>Account Details</Text>

            <View style={styles.profileImageContainer}>
              {profilePicture ? (
                <Image
                  source={{ uri: profilePicture }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Text style={styles.placeholderText}>No Image</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.uploadButton}
                onPress={pickImage}
                disabled={imageUploading}
              >
                <Text style={styles.uploadButtonText}>
                  {imageUploading ? "Uploading..." : "Upload Picture"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                placeholder="Email address"
                value={email}
                editable={false}
              />
              <Text style={styles.helperText}>Email cannot be changed</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>CNIC</Text>
              <TextInput
                style={styles.input}
                placeholder="Format: 12345-1234567-1"
                value={cnic}
                onChangeText={setCnic}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Business Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your business name"
                value={businessName}
                onChangeText={setBusinessName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Location *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your business address"
                value={location}
                onChangeText={setLocation}
                multiline
              />
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveChanges}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  contentContainer: {
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  profileImageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#e1e1e1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  placeholderText: {
    color: "#888",
  },
  uploadButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  uploadButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  inputContainer: {
    marginBottom: 15,
    width: "100%",
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: "500",
  },
  input: {
    height: 45,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "white",
  },
  disabledInput: {
    backgroundColor: "#f0f0f0",
    color: "#888",
  },
  helperText: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default SPAccountDetails;