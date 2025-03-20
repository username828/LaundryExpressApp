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
  Modal,
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
import { uploadImageToCloudinary } from "../../imageService";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

const SPAccountDetails = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cnic, setCnic] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [region, setRegion] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [coordinates, setCoordinates] = useState({
    latitude: null,
    longitude: null,
  });
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
        setAddress(userData.location?.address || "");
        setProfilePicture(userData.profilePicture || "");

        // Set coordinates if they exist in Firebase
        if (userData.location?.coordinates) {
          setCoordinates({
            latitude: userData.location.coordinates.latitude || null,
            longitude: userData.location.coordinates.longitude || null,
          });

          setSelectedLocation({
            latitude: userData.location.coordinates.latitude,
            longitude: userData.location.coordinates.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
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
        const data = await uploadImageToCloudinary(result.assets[0].uri);
        setProfilePicture(data);
        Alert.alert("Success", "Image uploaded successfully");
      } else {
        Alert.alert("Error", "Failed to upload image");
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    } finally {
      setImageUploading(false);
    }
  };

  const openMap = async () => {
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to use the map"
        );
        return;
      }

      // Set initial map region
      let initialRegion;

      // If we already have coordinates, use them
      if (selectedLocation && coordinates.latitude && coordinates.longitude) {
        initialRegion = {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
      } else {
        // Otherwise get current location
        const location = await Location.getCurrentPositionAsync({});
        initialRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
      }

      setRegion(initialRegion);
      setMapVisible(true);
    } catch (error) {
      console.error("Error opening map:", error);
      Alert.alert("Error", "Failed to open map. Please try again.");
    }
  };

  const handleSelectLocation = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({
      latitude,
      longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    setCoordinates({ latitude, longitude });
  };

  const confirmLocation = () => {
    setMapVisible(false);
    if (!selectedLocation) {
      Alert.alert("Error", "Please select a location on the map");
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
      if (!name || !phone || !address || !businessName) {
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

      // Prepare location data
      const locationData = {
        address: address,
        coordinates:
          coordinates.latitude && coordinates.longitude
            ? {
                latitude: coordinates.latitude,
                longitude: coordinates.longitude,
              }
            : null,
      };

      await updateDoc(userDocRef, {
        name,
        email,
        cnic,
        businessName,
        phone,
        location: locationData,
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
          <ActivityIndicator size="large" color="#333333" />
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
              <Text style={styles.label}>Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your business address"
                value={address}
                onChangeText={setAddress}
                multiline
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Pin Location on Map *</Text>
              <TouchableOpacity style={styles.mapButton} onPress={openMap}>
                <Ionicons
                  name="location"
                  size={20}
                  color="#fff"
                  style={styles.mapButtonIcon}
                />
                <Text style={styles.mapButtonText}>
                  {coordinates.latitude && coordinates.longitude
                    ? "Update Location"
                    : "Select Location on Map"}
                </Text>
              </TouchableOpacity>

              {coordinates.latitude && coordinates.longitude && (
                <View style={styles.coordinatesDisplay}>
                  <Text style={styles.coordinatesText}>
                    Lat: {coordinates.latitude.toFixed(6)}, Lng:{" "}
                    {coordinates.longitude.toFixed(6)}
                  </Text>
                </View>
              )}
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

        {/* Map Modal */}
        <Modal
          visible={mapVisible}
          animationType="slide"
          onRequestClose={() => setMapVisible(false)}
        >
          <SafeAreaView style={styles.mapModalContainer}>
            <View style={styles.mapHeader}>
              <Text style={styles.mapTitle}>Select Your Business Location</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setMapVisible(false)}
              >
                <Ionicons name="close" size={24} color="#333333" />
              </TouchableOpacity>
            </View>

            {region ? (
              <View style={styles.mapWrapper}>
                <MapView
                  style={styles.map}
                  initialRegion={region}
                  onPress={handleSelectLocation}
                >
                  {selectedLocation && (
                    <Marker
                      coordinate={{
                        latitude: selectedLocation.latitude,
                        longitude: selectedLocation.longitude,
                      }}
                    />
                  )}
                </MapView>

                <View style={styles.mapOverlay}>
                  <TouchableOpacity
                    style={styles.confirmLocationButton}
                    onPress={confirmLocation}
                  >
                    <Text style={styles.confirmLocationText}>
                      Confirm Location
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.mapLoading}>
                <ActivityIndicator size="large" color="#333333" />
                <Text>Loading map...</Text>
              </View>
            )}
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  contentContainer: {
    padding: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 24,
    color: "#333333",
    textAlign: "center",
  },
  profileImageContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  placeholderText: {
    color: "#666666",
  },
  uploadButton: {
    backgroundColor: "#333333",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 15,
  },
  inputContainer: {
    marginBottom: 20,
    width: "100%",
  },
  label: {
    fontSize: 15,
    marginBottom: 8,
    fontWeight: "500",
    color: "#333333",
  },
  input: {
    height: 50,
    borderColor: "#e0e0e0",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "#ffffff",
    fontSize: 15,
  },
  disabledInput: {
    backgroundColor: "#f9f9f9",
    color: "#666666",
  },
  helperText: {
    fontSize: 12,
    color: "#666666",
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: "#333333",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#333333",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  mapButtonIcon: {
    marginRight: 8,
  },
  mapButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 15,
  },
  coordinatesDisplay: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  coordinatesText: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  mapHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#ffffff",
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
  },
  closeButton: {
    padding: 8,
  },
  mapWrapper: {
    flex: 1,
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
  },
  confirmLocationButton: {
    backgroundColor: "#333333",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmLocationText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  mapLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SPAccountDetails;
