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
  KeyboardAvoidingView,
  StatusBar,
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
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../theme/ThemeContext";

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

  const [focusedInput, setFocusedInput] = useState(null);
  const insets = useSafeAreaInsets();
  const theme = useTheme();

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
      setImageUploading(true);
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const data = await uploadImageToCloudinary(result.assets[0].uri);
        setProfilePicture(data);
        Alert.alert("Success", "Image uploaded successfully");
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
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading account details...</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDark]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Account Details</Text>
          </View>
        </LinearGradient>

        <SafeAreaView style={styles.container} edges={["bottom"]}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.profileSection}>
              <View style={styles.profileImageContainer}>
                {profilePicture ? (
                  <Image
                    source={{ uri: profilePicture }}
                    style={styles.profileImage}
                  />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Ionicons
                      name="business-outline"
                      size={40}
                      color="#FFFFFF"
                    />
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.uploadButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={pickImage}
                  disabled={imageUploading}
                >
                  <Ionicons
                    name="camera"
                    size={18}
                    color="#FFFFFF"
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.uploadButtonText}>
                    {imageUploading ? "Uploading..." : "Change Photo"}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.profileSubtitle}>
                Manage your business profile
              </Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Full Name <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    focusedInput === "name" && {
                      borderColor: theme.colors.primary,
                    },
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={
                      focusedInput === "name" ? theme.colors.primary : "#666"
                    }
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor={theme.colors.primary + "99"}
                    value={name}
                    onChangeText={setName}
                    onFocus={() => setFocusedInput("name")}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View
                  style={[styles.inputWrapper, styles.disabledInputWrapper]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color="#666"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, styles.disabledInput]}
                    placeholder="Email address"
                    value={email}
                    editable={false}
                  />
                  <View style={styles.readOnlyBadge}>
                    <Text style={styles.readOnlyText}>Read-only</Text>
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CNIC</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    focusedInput === "cnic" && {
                      borderColor: theme.colors.primary,
                    },
                  ]}
                >
                  <Ionicons
                    name="card-outline"
                    size={20}
                    color={
                      focusedInput === "cnic" ? theme.colors.primary : "#666"
                    }
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Format: 12345-1234567-1"
                    placeholderTextColor={theme.colors.primary + "99"}
                    value={cnic}
                    onChangeText={setCnic}
                    keyboardType="number-pad"
                    onFocus={() => setFocusedInput("cnic")}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Business Name <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    focusedInput === "business" && {
                      borderColor: theme.colors.primary,
                    },
                  ]}
                >
                  <Ionicons
                    name="business-outline"
                    size={20}
                    color={
                      focusedInput === "business"
                        ? theme.colors.primary
                        : "#666"
                    }
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your business name"
                    placeholderTextColor={theme.colors.primary + "99"}
                    value={businessName}
                    onChangeText={setBusinessName}
                    onFocus={() => setFocusedInput("business")}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Phone Number <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    focusedInput === "phone" && {
                      borderColor: theme.colors.primary,
                    },
                  ]}
                >
                  <Ionicons
                    name="call-outline"
                    size={20}
                    color={
                      focusedInput === "phone" ? theme.colors.primary : "#666"
                    }
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your phone number"
                    placeholderTextColor={theme.colors.primary + "99"}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    onFocus={() => setFocusedInput("phone")}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Address <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    focusedInput === "address" && {
                      borderColor: theme.colors.primary,
                    },
                    { height: 80 },
                  ]}
                >
                  <Ionicons
                    name="home-outline"
                    size={20}
                    color={
                      focusedInput === "address" ? theme.colors.primary : "#666"
                    }
                    style={[
                      styles.inputIcon,
                      { alignSelf: "flex-start", marginTop: 12 },
                    ]}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      { height: 80, textAlignVertical: "top", paddingTop: 12 },
                    ]}
                    placeholder="Enter your business address"
                    placeholderTextColor={theme.colors.primary + "99"}
                    value={address}
                    onChangeText={setAddress}
                    multiline
                    onFocus={() => setFocusedInput("address")}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Pin Location on Map <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.mapButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={openMap}
                >
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
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={theme.colors.primary}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.coordinatesText}>
                      Location selected successfully
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={saveChanges}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons
                      name="save-outline"
                      size={20}
                      color="#FFFFFF"
                      style={styles.buttonIcon}
                    />
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>

        {/* Map Modal */}
        <Modal
          visible={mapVisible}
          animationType="slide"
          onRequestClose={() => setMapVisible(false)}
        >
          <SafeAreaView style={styles.mapModalContainer}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryDark]}
              style={styles.mapHeader}
            >
              <Text style={styles.mapTitle}>Select Your Business Location</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setMapVisible(false)}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>

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
                    style={[
                      styles.confirmLocationButton,
                      { backgroundColor: theme.colors.primary },
                    ]}
                    onPress={confirmLocation}
                  >
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color="#FFFFFF"
                      style={styles.buttonIcon}
                    />
                    <Text style={styles.confirmLocationText}>
                      Confirm Location
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.mapLoading}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading map...</Text>
              </View>
            )}
          </SafeAreaView>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666666",
  },
  profileSection: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  profileImageContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    marginBottom: 10,
  },
  placeholderImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#cccccc",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    marginBottom: 10,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  uploadButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 13,
  },
  profileSubtitle: {
    fontSize: 14,
    color: "#666666",
    marginTop: 4,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: "500",
    color: "#333333",
    paddingLeft: 4,
  },
  requiredStar: {
    color: "#FF3B30",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    backgroundColor: "#f9f9f9",
    height: 56,
    overflow: "hidden",
  },
  disabledInputWrapper: {
    backgroundColor: "#f0f0f0",
  },
  inputIcon: {
    paddingLeft: 16,
    width: 46,
    textAlign: "center",
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 15,
    color: "#333333",
    paddingHorizontal: 12,
  },
  disabledInput: {
    color: "#666666",
    fontStyle: "italic",
  },
  readOnlyBadge: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  readOnlyText: {
    fontSize: 12,
    color: "#666666",
    fontWeight: "500",
  },
  buttonIcon: {
    marginRight: 8,
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
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
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  coordinatesText: {
    fontSize: 14,
    color: "#666666",
  },
  saveButton: {
    flexDirection: "row",
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  mapHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
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
    left: 20,
    right: 20,
  },
  confirmLocationButton: {
    flexDirection: "row",
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
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
