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
  Modal,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { getDocs, collection, query, where } from "firebase/firestore";
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
import { useOrderStatus } from "../../context/OrderStatusContext";

// Service categories constant
const SERVICE_CATEGORIES = [
  {
    id: "clothes",
    name: "Clothes",
    subcategories: ["Wash and Fold", "Dry Clean", "Iron"],
    icon: "shirt-outline",
  },
  {
    id: "shoes",
    name: "Shoes",
    subcategories: ["Wash"],
    icon: "footsteps-outline",
  },
  {
    id: "carpet",
    name: "Carpet",
    subcategories: ["Wash"],
    icon: "grid-outline",
  },
  {
    id: "luxury",
    name: "Luxury Wear",
    subcategories: ["Dry Clean", "Iron"],
    icon: "diamond-outline",
  },
  {
    id: "curtains",
    name: "Curtains",
    subcategories: ["Wash"],
    icon: "browsers-outline",
  },
  {
    id: "blankets",
    name: "Blankets",
    subcategories: ["Wash"],
    icon: "bed-outline",
  },
];

const ServiceProviderCard = ({
  provider,
  isFavourite,
  onToggleFavorite,
  distance,
}) => {
  const navigation = useNavigation();

  if (distance < 1) {
    distance = distance * 1000;
    distance = distance.toString() + " m";
  } else {
    distance = distance.toString() + " km";
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
        {provider.serviceCategories &&
          provider.serviceCategories.length > 0 && (
            <View style={styles.categoriesContainer}>
              {provider.serviceCategories.map((category, index) => (
                <View key={index} style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{category}</Text>
                </View>
              ))}
            </View>
          )}
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
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSubcategory, setSelectedSubcategory] = useState("All");
  const [categoryModalVisible, setcategoryModalVisible] = useState(false);
  const [subcategoryModalVisible, setSubcategoryModalVisible] = useState(false);
  const [availableSubcategories, setAvailableSubcategories] = useState([]);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);

  const [favorites, setFavorites] = useState([]);
  const { currentAddress, setCurrentAddress } = useContext(AddressContext); // Access global address state//useState("Loading Location...");

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [livelocation, setLiveLocation] = useState(null);

  const [loading, setLoading] = useState(true);
  const [servicesMap, setServicesMap] = useState({});
  const insets = useSafeAreaInsets();

  const navigation = useNavigation();

  // Fetch services data
  const fetchServicesData = async () => {
    try {
      const servicesSnapshot = await getDocs(collection(db, "services"));
      const servicesData = {};

      servicesSnapshot.forEach((doc) => {
        const serviceData = doc.data();
        if (serviceData.providerId) {
          if (!servicesData[serviceData.providerId]) {
            servicesData[serviceData.providerId] = {
              categories: new Set(),
              services: [],
            };
          }
          servicesData[serviceData.providerId].categories.add(
            serviceData.category
          );
          servicesData[serviceData.providerId].services.push({
            category: serviceData.category,
            subcategory: serviceData.subcategory,
            name: serviceData.name,
            price: serviceData.price,
          });
        }
      });

      // Convert Sets to arrays
      Object.keys(servicesData).forEach((providerId) => {
        servicesData[providerId].categories = Array.from(
          servicesData[providerId].categories
        );
      });

      setServicesMap(servicesData);
      return servicesData;
    } catch (error) {
      console.error("Error fetching services:", error);
      return {};
    }
  };

  useEffect(() => {
    const fetchServiceProviders = async () => {
      setLoading(true); // Show loading
      try {
        // First fetch all services
        const servicesData = await fetchServicesData();

        // Then fetch service providers
        const querySnapshot = await getDocs(collection(db, "serviceProviders"));
        const providers = querySnapshot.docs.map((doc) => {
          const providerData = doc.data();
          const providerId = doc.id;

          // Add services data to provider
          const providerServices = servicesData[providerId] || {
            categories: [],
            services: [],
          };

          return {
            ...providerData,
            serviceProviderId: providerId,
            serviceCategories: providerServices.categories,
            services: providerServices.services,
          };
        });

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
    let filtered = serviceProviders;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((provider) =>
        provider.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply rating filter
    if (minRating !== "All") {
      filtered = filtered.filter(
        (provider) => provider.rating >= parseFloat(minRating)
      );
    }

    // Apply category filter
    if (selectedCategory !== "All") {
      filtered = filtered.filter((provider) =>
        provider.serviceCategories?.includes(selectedCategory)
      );

      // Find all available subcategories for this category from the providers
      const subcats = new Set();
      filtered.forEach((provider) => {
        if (provider.services) {
          provider.services.forEach((service) => {
            if (service.category === selectedCategory) {
              subcats.add(service.subcategory);
            }
          });
        }
      });
      setAvailableSubcategories([...subcats]);
    }

    // Apply subcategory filter
    if (selectedCategory !== "All" && selectedSubcategory !== "All") {
      filtered = filtered.filter((provider) =>
        provider.services?.some(
          (service) =>
            service.category === selectedCategory &&
            service.subcategory === selectedSubcategory
        )
      );
    }

    // Apply old service filter if no category/subcategory is selected
    if (selectedService !== "All" && selectedCategory === "All") {
      filtered = filtered.filter(
        (provider) =>
          provider.servicesOffered?.some(
            (service) => service.toLowerCase() === selectedService.toLowerCase()
          ) ?? false
      );
    }

    // Apply location-based calculations and sorting
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
  }, [
    searchQuery,
    minRating,
    serviceProviders,
    selectedService,
    selectedLocation,
    livelocation,
    selectedCategory,
    selectedSubcategory,
  ]);

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

  // Open category selection modal
  const openCategoryModal = () => {
    setcategoryModalVisible(true);
  };

  // Select a category
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setSelectedSubcategory("All");
    setcategoryModalVisible(false);

    if (category !== "All") {
      const categoryObj = SERVICE_CATEGORIES.find(
        (cat) => cat.name === category
      );
      if (categoryObj) {
        setAvailableSubcategories(categoryObj.subcategories);
        setSubcategoryModalVisible(true);
      }
    }
  };

  // Select a subcategory
  const handleSubcategorySelect = (subcategory) => {
    setSelectedSubcategory(subcategory);
    setSubcategoryModalVisible(false);
  };

  // Open rating selection modal
  const openRatingModal = () => {
    setRatingModalVisible(true);
  };

  // Select a rating
  const handleRatingSelect = (rating) => {
    setMinRating(rating);
    setRatingModalVisible(false);
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

          setLiveLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });

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

  // Determine if filter selection is active
  const isFilterActive =
    selectedCategory !== "All" ||
    selectedSubcategory !== "All" ||
    minRating !== "All";

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={[styles.header, { marginTop: insets.top > 0 ? 0 : 25 }]}>
          <Pressable onPress={() => navigation.navigate("Map")}>
            <MaterialIcons name="location-on" size={24} color="#2D9CDB" />
          </Pressable>
          <View>
            <Text style={styles.addressTitle}>
              {currentAddress || "Fetching Address..."}
            </Text>
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

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedCategory !== "All" && styles.filterButtonActive,
            ]}
            onPress={openCategoryModal}
          >
            <Ionicons
              name="options-outline"
              size={18}
              color={selectedCategory !== "All" ? "#fff" : "#333"}
            />
            <Text
              style={[
                styles.filterButtonText,
                selectedCategory !== "All" && styles.filterButtonTextActive,
              ]}
            >
              {selectedCategory === "All" ? "Category" : selectedCategory}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              minRating !== "All" && styles.filterButtonActive,
            ]}
            onPress={openRatingModal}
          >
            <Ionicons
              name="star-outline"
              size={18}
              color={minRating !== "All" ? "#fff" : "#333"}
            />
            <Text
              style={[
                styles.filterButtonText,
                minRating !== "All" && styles.filterButtonTextActive,
              ]}
            >
              {minRating === "All" ? "Rating" : `${minRating}+ Stars`}
            </Text>
          </TouchableOpacity>

          {isFilterActive && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSelectedCategory("All");
                setSelectedSubcategory("All");
                setMinRating("All");
              }}
            >
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {selectedCategory !== "All" && selectedSubcategory !== "All" && (
          <View style={styles.activeFiltersContainer}>
            <Text style={styles.activeFilterTag}>
              {selectedCategory}: {selectedSubcategory}
              <Text
                style={styles.removeFilterTag}
                onPress={() => setSelectedSubcategory("All")}
              >
                {" "}
                ✕
              </Text>
            </Text>
          </View>
        )}

        {minRating !== "All" && (
          <View style={styles.activeFiltersContainer}>
            <Text style={styles.activeFilterTag}>
              Rating: {minRating}+ Stars
              <Text
                style={styles.removeFilterTag}
                onPress={() => setMinRating("All")}
              >
                ✕
              </Text>
            </Text>
          </View>
        )}

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
            ListEmptyComponent={() => (
              <View style={styles.emptyResultsContainer}>
                <Ionicons name="search-outline" size={64} color="#ccc" />
                <Text style={styles.emptyResultsText}>
                  No service providers found
                </Text>
                <Text style={styles.emptyResultsSubtext}>
                  Try adjusting your filters
                </Text>
              </View>
            )}
          />
        )}

        {/* Category Selection Modal */}
        <Modal
          transparent={true}
          visible={categoryModalVisible}
          animationType="slide"
          onRequestClose={() => setcategoryModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Category</Text>
                <TouchableOpacity
                  onPress={() => setcategoryModalVisible(false)}
                >
                  <Ionicons name="close-outline" size={28} color="#333" />
                </TouchableOpacity>
              </View>

              <FlatList
                data={[{ id: "all", name: "All" }, ...SERVICE_CATEGORIES]}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() =>
                      handleCategorySelect(
                        item.id === "all" ? "All" : item.name
                      )
                    }
                  >
                    {item.id !== "all" && (
                      <Ionicons
                        name={item.icon}
                        size={24}
                        color="#333"
                        style={styles.modalItemIcon}
                      />
                    )}
                    {item.id === "all" && (
                      <Ionicons
                        name="grid-outline"
                        size={24}
                        color="#333"
                        style={styles.modalItemIcon}
                      />
                    )}
                    <Text style={styles.modalItemText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* Subcategory Selection Modal */}
        <Modal
          transparent={true}
          visible={subcategoryModalVisible}
          animationType="slide"
          onRequestClose={() => setSubcategoryModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    setSubcategoryModalVisible(false);
                    setcategoryModalVisible(true);
                  }}
                >
                  <Ionicons name="arrow-back-outline" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  {selectedCategory} Services
                </Text>
                <TouchableOpacity
                  onPress={() => setSubcategoryModalVisible(false)}
                >
                  <Ionicons name="close-outline" size={28} color="#333" />
                </TouchableOpacity>
              </View>

              <FlatList
                data={[
                  { id: "all", name: "All" },
                  ...availableSubcategories.map((subcat, index) => ({
                    id: `subcat-${index}`,
                    name: subcat,
                  })),
                ]}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() =>
                      handleSubcategorySelect(
                        item.id === "all" ? "All" : item.name
                      )
                    }
                  >
                    <Text style={styles.modalItemText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* Rating Selection Modal */}
        <Modal
          transparent={true}
          visible={ratingModalVisible}
          animationType="slide"
          onRequestClose={() => setRatingModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Rating</Text>
                <TouchableOpacity onPress={() => setRatingModalVisible(false)}>
                  <Ionicons name="close-outline" size={28} color="#333" />
                </TouchableOpacity>
              </View>

              <FlatList
                data={[
                  { id: "all", name: "All Ratings", value: "All" },
                  { id: "rating-3", name: "3+ Stars", value: "3" },
                  { id: "rating-4", name: "4+ Stars", value: "4" },
                  { id: "rating-5", name: "5 Stars", value: "5" },
                ]}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => handleRatingSelect(item.value)}
                  >
                    <View style={styles.ratingModalItem}>
                      {item.value !== "All" && (
                        <View style={styles.starsContainer}>
                          {[...Array(parseInt(item.value))].map((_, i) => (
                            <Ionicons
                              key={i}
                              name="star"
                              size={18}
                              color="#FFD700"
                            />
                          ))}
                          {item.value !== "5" && (
                            <Text style={styles.plusSign}>+</Text>
                          )}
                        </View>
                      )}
                      <Text style={styles.modalItemText}>{item.name}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
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
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: "#2D9CDB",
  },
  filterButtonText: {
    color: "#333",
    marginLeft: 5,
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  clearButton: {
    marginLeft: "auto",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearButtonText: {
    color: "#2D9CDB",
    fontSize: 14,
  },
  activeFiltersContainer: {
    flexDirection: "row",
    paddingHorizontal: 10,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  activeFilterTag: {
    backgroundColor: "#E1F5FE",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginRight: 8,
    marginBottom: 5,
    fontSize: 13,
    color: "#0277BD",
  },
  removeFilterTag: {
    color: "#0277BD",
    fontWeight: "bold",
  },
  emptyResultsContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyResultsText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
  },
  emptyResultsSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
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
  distanceText: { fontSize: 14, color: "#555" },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 5,
  },
  categoryBadge: {
    backgroundColor: "#F0F8FF",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 5,
    marginBottom: 5,
  },
  categoryText: {
    fontSize: 10,
    color: "#0066CC",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
    maxHeight: "60%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  modalItemIcon: {
    marginRight: 16,
    width: 24,
  },
  modalItemText: {
    fontSize: 16,
    color: "#333",
  },
  ratingModalItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  starsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  plusSign: {
    marginLeft: 4,
  },
});

export default HomeScreen;
