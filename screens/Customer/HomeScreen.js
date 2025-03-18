import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Picker } from "@react-native-picker/picker";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import {
  SafeAreaView,
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { AddressContext } from "../../context/AddressContext";
import { connectStorageEmulator } from "firebase/storage";

const ServiceProviderCard = ({ provider, isFavourite, onToggleFavorite,distance }) => {
  const navigation = useNavigation();

  if(distance<1){
    distance=distance*1000;
    distance=distance.toString()+" m";
  }
  else{
    distance=distance.toString()+" km";
  }
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        if (!provider.serviceProviderId) {
          console.error(
            "serviceProviderId is undefined for provider:",
            provider
          );
          Alert.alert("Error", "Cannot view this service provider details.");
          return;
        }

        navigation.navigate("ServiceProviderScreen", {
          providerId: provider.serviceProviderId,
        });
      }}
    >
      <Image source={{ uri: provider.image }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <View style={styles.providerHeader}>
          <Text style={styles.providerName}>{provider.name}</Text>
          <Pressable
            onPress={() => onToggleFavorite(provider.serviceProviderId)}
          >
            <MaterialIcons
              name={isFavourite ? "favorite" : "favorite-outline"}
              size={24}
              color="red"
            />
          </Pressable>
        </View>
        <Text style={styles.rating}>⭐ {provider.rating}</Text>
        <Text style={styles.distanceText}>📍 {distance}</Text>

      </View>
    </TouchableOpacity>
  );
};

const HomeScreen = () => {
  const [serviceProviders, setServiceProviders] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [minRating, setMinRating] = useState("All");
  const [selectedService, setSelectedService] = useState("All");

  const [favorites, setFavorites] = useState([]);
  const { currentAddress, setCurrentAddress } = useContext(AddressContext); // Access global address state//useState("Loading Location...");

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [livelocation, setLiveLocation] = useState(null);

  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  const navigation = useNavigation();

  useEffect(() => {
    const fetchServiceProviders = async () => {
      setLoading(true); // Show loading
      try {
        const querySnapshot = await getDocs(collection(db, "serviceProviders"));
        const providers = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          serviceProviderId: doc.id, // Add the document ID as serviceProviderId
        }));
        setServiceProviders(providers);
        setFilteredProviders(providers);
        await AsyncStorage.setItem(
          "serviceProviders",
          JSON.stringify(providers)
        );
      } catch (error) {
        console.error("Error fetching providers:", error);
      } finally {
        setLoading(false); // Hide loading
      }
    };
    fetchServiceProviders();
  }, []);

  useEffect(() => {
    let filtered = serviceProviders.filter((provider) =>
      provider.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  
    if (minRating !== "All") {
      filtered = filtered.filter(
        (provider) => provider.rating >= parseFloat(minRating)
      );
    }
  
    if (selectedService !== "All") {
      filtered = filtered.filter(
        (provider) =>
          provider.servicesOffered?.some(
            (service) => service.toLowerCase() === selectedService.toLowerCase()
          ) ?? false
      );
    }
  
    // Get user's location (selected or live)
    const userLat = selectedLocation?.latitude || livelocation?.latitude;
    const userLong = selectedLocation?.longitude || livelocation?.longitude;
  
    if (userLat && userLong) {
      filtered = filtered.map((provider) => {
        if (
          provider.location?.coordinates?.latitude &&
          provider.location?.coordinates?.longitude
        ) {
          const distance = getDistance(
            provider.location.coordinates.latitude,
            provider.location.coordinates.longitude,
            userLat,
            userLong
          );
          return { ...provider, distance }; // Add distance field
        }
        return { ...provider, distance: Infinity }; // If no location, set to high distance
      });
  
      // Sort by distance
      filtered.sort((a, b) => a.distance - b.distance);
    }
  
    setFilteredProviders(filtered);
  }, [searchQuery, minRating, serviceProviders, selectedService, selectedLocation, livelocation]);
  

  // Load favorites from AsyncStorage
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const storedFavorites = await AsyncStorage.getItem("favorites");
        if (storedFavorites) {
          setFavorites(JSON.parse(storedFavorites));
        }
      } catch (error) {
        console.error("Error loading favorites:", error);
      }
    };

    loadFavorites();
  }, []);

  // Toggle Favorite
  const toggleFavorite = async (providerId) => {
    try {
      const updatedFavorites = favorites.includes(providerId)
        ? favorites.filter((id) => id !== providerId)
        : [...favorites, providerId];

      setFavorites(updatedFavorites);
      await AsyncStorage.setItem("favorites", JSON.stringify(updatedFavorites)); // Ensure it fully saves
      console.log("Updated Favorites:", updatedFavorites);
    } catch (error) {
      console.error("Error updating favorites:", error);
    }
  };

  // Location handling

  const route = useRoute();

  useEffect(() => {
    if (route.params?.selectedAddress) {
      setCurrentAddress(route.params.selectedAddress);
      setSelectedLocation(route.params.selectedLocation);
    } else {
      const checkLocationEnabled = async () => {
        let enabled = await Location.hasServicesEnabledAsync();
        if (!enabled) {
          alert("Location not Enabled", "Enable Location", [
            { text: "Cancel", style: "cancel" },
            { text: "OK" },
          ]);
        }
      };

      const getCurrentLocation = async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") {
            alert("Permission not Granted", "Allow Location Services", [
              { text: "Cancel", style: "cancel" },
              { text: "OK" },
            ]);
            return;
          }

          const location = await Location.getCurrentPositionAsync();
          console.log("Location fetched:", location);

          if (!location || !location.coords) {
            throw new Error("Location data is empty");
          }

          // console.log(serviceProviders[2].name);
          // const splat = serviceProviders[2].location.coordinates.latitude;
          // const splong = serviceProviders[2].location.coordinates.longitude;

          // console.log(splat, splong);
          // const clat = location.coords.latitude;
          // const clong = location.coords.longitude;
          setLiveLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });

          // console.log("Distance:", getDistance(splat, splong, clat, clong));

          const address = await reverseGeocode(

            location.coords.latitude,
            location.coords.longitude
            
          );
          console.log("Address:", address);
          setCurrentAddress(address);
        } catch (error) {
          console.error("Location Error:", error);
          setCurrentAddress("Error fetching location");

          if (
            error.message.includes("API limit") ||
            error.code === "E_API_LIMIT"
          ) {
            alert("API Limit Reached", "Try again later.");
          }
        }
      };

      const reverseGeocode = async (latitude, longitude) => {
        try {
          const result = await Location.reverseGeocodeAsync({
            latitude,
            longitude,
          });
          if (result.length > 0) {
            const { city, region, country, name } = result[0];
            return `${name}, ${city}, ${region}, ${country}`;
          }
          return "Address not found";
        } catch (error) {
          console.error("Reverse Geocoding Error:", error);
          return "Error fetching address";
        }
      };

      checkLocationEnabled();
      getCurrentLocation();
    }
  }, [route.params?.selectedAddress]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={[styles.header, { marginTop: insets.top > 0 ? 0 : 25 }]}>
          <Pressable onPress={() => navigation.navigate("Map")}>
            <MaterialIcons name="location-on" size={24} color="#2D9CDB" />
          </Pressable>
          <View>
            <Text style={styles.addressTitle}>{currentAddress || "Fetching Address..."}</Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={24} color="gray" />
          <TextInput
            placeholder="Search for Laundry Services"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filterContainer}>
          <Picker
            selectedValue={minRating}
            onValueChange={(itemValue) => setMinRating(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Sort by Rating" value="All" />
            <Picker.Item label="3+ Stars" value="3" />
            <Picker.Item label="4+ Stars" value="4" />
            <Picker.Item label="5 Stars" value="5" />
          </Picker>

          <Picker
            selectedValue={selectedService}
            onValueChange={(itemValue) => setSelectedService(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Services" value="All" />
            <Picker.Item label="Dry Cleaning" value="Dry" />
            <Picker.Item label="Wash & Fold" value="Washing" />
            <Picker.Item label="Ironing" value="Ironing" />
          </Picker>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
        ) : (
          <FlatList
          data={filteredProviders}
          keyExtractor={(item, index) =>
            item.serviceProviderId || index.toString()
          }
          renderItem={({ item }) => {
            // Use selected location if available; otherwise, use mobile location
            const userLat =
              selectedLocation?.latitude || livelocation?.latitude;
            const userLong =
              selectedLocation?.longitude || livelocation?.longitude;
        
            let distance = "N/A"; // Default value
        
            if (
              userLat &&
              userLong &&
              item.location?.coordinates?.latitude &&
              item.location?.coordinates?.longitude
            ) {
              distance = getDistance(
                item.location.coordinates.latitude,
                item.location.coordinates.longitude,
                userLat,
                userLong
              ).toFixed(2); // Keep 2 decimal places


            }
        
            return (
              <ServiceProviderCard
                provider={item}
                distance={distance} // Pass distance to the component
                isFavourite={favorites.includes(item.serviceProviderId)}
                onToggleFavorite={toggleFavorite}
              />
            );
          }}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
        
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
};
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: 12,
    margin: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    elevation: 4,
  },
  addressTitle: { fontSize: 10, fontWeight: "600", color: "gray" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    margin: 10,
    padding: 12,
    borderRadius: 8,
    elevation: 2,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
    marginBottom: 10,
  },
  filterLabel: { fontSize: 14, fontWeight: "600", marginRight: 10 },
  picker: {
    flex: 1,
    height: 60,
    backgroundColor: "white",
    borderRadius: 8,
    maxWidth: 200,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 12,
    margin: 10,
    elevation: 3,
  },
  cardImage: { width: 80, height: 80, borderRadius: 8, marginRight: 12 },
  cardContent: { justifyContent: "center", flex: 1 },
  providerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  providerName: { fontSize: 16, fontWeight: "bold" },
  rating: { fontSize: 14, color: "#555" },
  distanceText: {fontSize: 14, color: "#555"}
});

export default HomeScreen;
