import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const SPMapScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const [region, setRegion] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const handleMapLoad = () => {
    console.log("Map has loaded!");
    setIsMapLoaded(true);
  };

  useEffect(() => {
    const getLocation = async () => {
      // If we have an initial location from params, use it
      if (route.params?.initialLocation) {
        setRegion(route.params.initialLocation);
        setSelectedLocation({
          latitude: route.params.initialLocation.latitude,
          longitude: route.params.initialLocation.longitude,
        });
        // Reverse geocode to get the address
        reverseGeocode(
          route.params.initialLocation.latitude,
          route.params.initialLocation.longitude
        );
        return;
      }

      // Otherwise get current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Location permission denied");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    };

    getLocation();
  }, [route.params?.initialLocation]);

  const reverseGeocode = async (latitude, longitude) => {
    setLoadingAddress(true);
    try {
      const addressData = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      if (addressData.length > 0) {
        const { name, street, city, region, country } = addressData[0];
        const formattedAddress = `${name || ""} ${street || ""}, ${
          city || ""
        }, ${region || ""}, ${country || ""}`
          .trim()
          .replace(/^,\s*|,\s*$/g, "")
          .replace(/,\s*,/g, ",");
        setSelectedAddress(formattedAddress);
      } else {
        setSelectedAddress("Unknown location");
      }
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      setSelectedAddress("Error fetching address");
    }
    setLoadingAddress(false);
  };

  const handleSelectLocation = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    await reverseGeocode(latitude, longitude);
  };

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      navigation.navigate("SPAccountDetails", {
        selectedLocation,
        selectedAddress,
      });
    } else {
      alert("Please select a location on the map");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={[styles.header, { marginTop: insets.top > 0 ? 0 : 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Business Location</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Map Section */}
      <View style={styles.mapContainer}>
        {region ? (
          <>
            <MapView
              style={styles.map}
              region={region}
              onPress={handleSelectLocation}
              onMapReady={handleMapLoad}
            >
              {selectedLocation && <Marker coordinate={selectedLocation} />}
            </MapView>
            {!isMapLoaded && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#454545" />
                <Text style={styles.loadingText}>Loading map...</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#454545" />
            <Text style={styles.loadingText}>Fetching location...</Text>
          </View>
        )}
      </View>

      {/* UI Overlay */}
      <View style={styles.overlay}>
        <View style={styles.addressContainer}>
          {loadingAddress ? (
            <ActivityIndicator size="small" color="#454545" />
          ) : (
            isMapLoaded && (
              <Text style={styles.addressText}>
                {selectedAddress || "Tap on the map to select a location"}
              </Text>
            )
          )}
        </View>

        {isMapLoaded && (
          <TouchableOpacity
            style={[
              styles.confirmButton,
              !selectedLocation && { backgroundColor: "#B0BEC5" },
            ]}
            onPress={handleConfirmLocation}
            disabled={!selectedLocation}
          >
            <Text style={styles.buttonText}>Confirm Location</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  backButton: {
    padding: 8,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "bold",
    color: "#666",
  },
  overlay: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  addressContainer: {
    padding: 12,
    backgroundColor: "white",
    borderRadius: 12,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    alignItems: "center",
    minWidth: "80%",
    marginBottom: 12,
  },
  addressText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  confirmButton: {
    backgroundColor: "#454545",
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: "center",
    borderRadius: 12,
    elevation: 4,
    width: "100%",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default SPMapScreen;
