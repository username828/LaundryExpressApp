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
  StatusBar,
  Dimensions,
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
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../theme/ThemeContext";

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
  theme,
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
      style={[styles.card, { ...theme.shadows.medium }]}
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
          <Text
            style={[styles.providerName, { color: theme.colors.textPrimary }]}
          >
            {provider.name}
          </Text>
          <Pressable
            onPress={() => onToggleFavorite(provider.serviceProviderId)}
            style={styles.favoriteButton}
          >
            <MaterialIcons
              name={isFavourite ? "favorite" : "favorite-outline"}
              size={24}
              color={theme.colors.secondary}
            />
          </Pressable>
        </View>
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.rating}>{provider.rating}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons
              name="location"
              size={16}
              color={theme.colors.secondary}
            />
            <Text style={styles.distanceText}>{distance}</Text>
          </View>
        </View>
        {provider.serviceCategories &&
          provider.serviceCategories.length > 0 && (
            <View style={styles.categoriesContainer}>
              {provider.serviceCategories.map((category, index) => (
                <View
                  key={index}
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: `${theme.colors.primary}15` },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      { color: theme.colors.primary },
                    ]}
                  >
                    {category}
                  </Text>
                </View>
              ))}
            </View>
          )}
      </View>
    </TouchableOpacity>
  );
};

const HomeScreen = () => {
  const theme = useTheme();
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

  // Price filter states
  const [priceFilter, setPriceFilter] = useState("All");
  const [priceModalVisible, setPriceModalVisible] = useState(false);

  // Distance filter states
  const [distanceFilter, setDistanceFilter] = useState("All");
  const [distanceModalVisible, setDistanceModalVisible] = useState(false);

  const [favorites, setFavorites] = useState([]);
  const { currentAddress, setCurrentAddress } = useContext(AddressContext); // Access global address state//useState("Loading Location...");

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [livelocation, setLiveLocation] = useState(null);

  const [loading, setLoading] = useState(true);
  const [servicesMap, setServicesMap] = useState({});
  const insets = useSafeAreaInsets();

  const navigation = useNavigation();
  const screenWidth = Dimensions.get("window").width;

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

    // Apply price filter
    if (priceFilter !== "All") {
      filtered = filtered.filter((provider) => {
        // Check if provider has any service within the price range
        return provider.services?.some((service) => {
          const price = service.price || 0;
          switch (priceFilter) {
            case "$":
              return price >= 0 && price <= 10;
            case "$$":
              return price > 10 && price <= 20;
            case "$$$":
              return price > 20;
            default:
              return true;
          }
        });
      });
    }

    // Apply location-based calculations
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

      // Apply distance filter if selected
      if (distanceFilter !== "All") {
        filtered = filtered.filter((provider) => {
          const providerDistance = provider.distance || Infinity;
          switch (distanceFilter) {
            case "Near":
              return providerDistance >= 0 && providerDistance <= 3;
            case "Medium":
              return providerDistance > 3 && providerDistance <= 7;
            case "Far":
              return providerDistance > 7;
            default:
              return true;
          }
        });
      }

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
    priceFilter,
    distanceFilter,
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

  // Open price selection modal
  const openPriceModal = () => {
    setPriceModalVisible(true);
  };

  // Select a price range
  const handlePriceSelect = (price) => {
    setPriceFilter(price);
    setPriceModalVisible(false);
  };

  // Open distance selection modal
  const openDistanceModal = () => {
    setDistanceModalVisible(true);
  };

  // Select a distance range
  const handleDistanceSelect = (distance) => {
    setDistanceFilter(distance);
    setDistanceModalVisible(false);
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
    minRating !== "All" ||
    priceFilter !== "All" ||
    distanceFilter !== "All";

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.primary}
      />
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.colors.backgroundLight },
        ]}
        edges={["top"]}
      >
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDark]}
          style={styles.headerContainer}
        >
          <View style={styles.headerContent}>
            <View style={styles.locationContainer}>
              <Pressable
                onPress={() => navigation.navigate("Map")}
                style={styles.locationButton}
              >
                <MaterialIcons
                  name="location-on"
                  size={24}
                  color={theme.colors.textLight}
                />
              </Pressable>
              <View>
                <Text style={styles.deliveryText}>Delivery to</Text>
                <Text style={styles.addressText}>
                  {currentAddress || "Fetching Address..."}
                </Text>
              </View>
            </View>
            <View style={styles.searchContainer}>
              <MaterialIcons
                name="search"
                size={20}
                color={theme.colors.placeholder}
              />
              <TextInput
                placeholder="Search for Laundry Services"
                placeholderTextColor={theme.colors.placeholder}
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>
        </LinearGradient>

        <View style={styles.filtersSection}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
          >
            Filters
          </Text>
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedCategory !== "All" && [
                  styles.filterButtonActive,
                  { backgroundColor: theme.colors.primary },
                ],
              ]}
              onPress={openCategoryModal}
            >
              <Ionicons
                name="options-outline"
                size={18}
                color={
                  selectedCategory !== "All"
                    ? theme.colors.textLight
                    : theme.colors.textPrimary
                }
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
                minRating !== "All" && [
                  styles.filterButtonActive,
                  { backgroundColor: theme.colors.primary },
                ],
              ]}
              onPress={openRatingModal}
            >
              <Ionicons
                name="star-outline"
                size={18}
                color={
                  minRating !== "All"
                    ? theme.colors.textLight
                    : theme.colors.textPrimary
                }
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

            {/* Price Filter Button */}
            <TouchableOpacity
              style={[
                styles.filterButton,
                priceFilter !== "All" && [
                  styles.filterButtonActive,
                  { backgroundColor: theme.colors.primary },
                ],
              ]}
              onPress={openPriceModal}
            >
              <Ionicons
                name="cash-outline"
                size={18}
                color={
                  priceFilter !== "All"
                    ? theme.colors.textLight
                    : theme.colors.textPrimary
                }
              />
              <Text
                style={[
                  styles.filterButtonText,
                  priceFilter !== "All" && styles.filterButtonTextActive,
                ]}
              >
                {priceFilter === "All" ? "Price" : priceFilter}
              </Text>
            </TouchableOpacity>

            {/* Distance Filter Button */}
            <TouchableOpacity
              style={[
                styles.filterButton,
                distanceFilter !== "All" && [
                  styles.filterButtonActive,
                  { backgroundColor: theme.colors.primary },
                ],
              ]}
              onPress={openDistanceModal}
            >
              <Ionicons
                name="navigate-outline"
                size={18}
                color={
                  distanceFilter !== "All"
                    ? theme.colors.textLight
                    : theme.colors.textPrimary
                }
              />
              <Text
                style={[
                  styles.filterButtonText,
                  distanceFilter !== "All" && styles.filterButtonTextActive,
                ]}
              >
                {distanceFilter === "All" ? "Distance" : distanceFilter}
              </Text>
            </TouchableOpacity>

            {isFilterActive && (
              <TouchableOpacity
                style={[styles.clearButton, { color: theme.colors.secondary }]}
                onPress={() => {
                  setSelectedCategory("All");
                  setSelectedSubcategory("All");
                  setMinRating("All");
                  setPriceFilter("All");
                  setDistanceFilter("All");
                }}
              >
                <Text
                  style={[
                    styles.clearButtonText,
                    { color: theme.colors.secondary },
                  ]}
                >
                  Clear All
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Active filters */}
        <View style={styles.activeFiltersContainer}>
          {minRating !== "All" && (
            <View
              style={[
                styles.activeFilterTag,
                { backgroundColor: `${theme.colors.primary}15` },
              ]}
            >
              <Text
                style={[
                  styles.activeFilterTagText,
                  { color: theme.colors.primary },
                ]}
              >
                Rating: {minRating}+ Stars
              </Text>
              <TouchableOpacity onPress={() => setMinRating("All")}>
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={theme.colors.primary}
                  style={styles.removeFilterIcon}
                />
              </TouchableOpacity>
            </View>
          )}

          {selectedCategory !== "All" && selectedSubcategory !== "All" && (
            <View
              style={[
                styles.activeFilterTag,
                { backgroundColor: `${theme.colors.primary}15` },
              ]}
            >
              <Text
                style={[
                  styles.activeFilterTagText,
                  { color: theme.colors.primary },
                ]}
              >
                {selectedCategory}: {selectedSubcategory}
              </Text>
              <TouchableOpacity onPress={() => setSelectedSubcategory("All")}>
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={theme.colors.primary}
                  style={styles.removeFilterIcon}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Price Active Filter Tag */}
          {priceFilter !== "All" && (
            <View
              style={[
                styles.activeFilterTag,
                { backgroundColor: `${theme.colors.primary}15` },
              ]}
            >
              <Text
                style={[
                  styles.activeFilterTagText,
                  { color: theme.colors.primary },
                ]}
              >
                Price: {priceFilter}
                {priceFilter === "$" && " (0-10)"}
                {priceFilter === "$$" && " (10-20)"}
                {priceFilter === "$$$" && " (20-40)"}
              </Text>
              <TouchableOpacity onPress={() => setPriceFilter("All")}>
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={theme.colors.primary}
                  style={styles.removeFilterIcon}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Distance Active Filter Tag */}
          {distanceFilter !== "All" && (
            <View
              style={[
                styles.activeFilterTag,
                { backgroundColor: `${theme.colors.primary}15` },
              ]}
            >
              <Text
                style={[
                  styles.activeFilterTagText,
                  { color: theme.colors.primary },
                ]}
              >
                Distance: {distanceFilter}
                {distanceFilter === "Near" && " (0-3 km)"}
                {distanceFilter === "Medium" && " (3-7 km)"}
                {distanceFilter === "Far" && " (>7 km)"}
              </Text>
              <TouchableOpacity onPress={() => setDistanceFilter("All")}>
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={theme.colors.primary}
                  style={styles.removeFilterIcon}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.providersListContainer}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
          >
            Laundry Services Near You
          </Text>

          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Finding nearby services...</Text>
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
                    theme={theme}
                  />
                );
              }}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={() => (
                <View style={styles.emptyResultsContainer}>
                  <Ionicons
                    name="search-outline"
                    size={64}
                    color={theme.colors.textTertiary}
                  />
                  <Text
                    style={[
                      styles.emptyResultsText,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    No service providers found
                  </Text>
                  <Text
                    style={[
                      styles.emptyResultsSubtext,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Try adjusting your filters or location
                  </Text>
                </View>
              )}
            />
          )}
        </View>

        {/* Modals remain mostly the same, with updated styling for consistency */}
        {/* Category Selection Modal */}
        <Modal
          transparent={true}
          visible={categoryModalVisible}
          animationType="slide"
          onRequestClose={() => setcategoryModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { ...theme.shadows.large }]}>
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.primaryDark]}
                style={styles.modalHeader}
              >
                <Text style={styles.modalTitle}>Select Category</Text>
                <TouchableOpacity
                  onPress={() => setcategoryModalVisible(false)}
                >
                  <Ionicons
                    name="close-outline"
                    size={28}
                    color={theme.colors.textLight}
                  />
                </TouchableOpacity>
              </LinearGradient>

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
                    <View
                      style={[
                        styles.modalIconContainer,
                        { backgroundColor: `${theme.colors.primary}15` },
                      ]}
                    >
                      {item.id !== "all" && (
                        <Ionicons
                          name={item.icon}
                          size={24}
                          color={theme.colors.primary}
                        />
                      )}
                      {item.id === "all" && (
                        <Ionicons
                          name="grid-outline"
                          size={24}
                          color={theme.colors.primary}
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.modalItemText,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      {item.name}
                    </Text>
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
            <View style={[styles.modalContainer, { ...theme.shadows.large }]}>
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.primaryDark]}
                style={styles.modalHeader}
              >
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    setSubcategoryModalVisible(false);
                    setcategoryModalVisible(true);
                  }}
                >
                  <Ionicons
                    name="arrow-back-outline"
                    size={24}
                    color={theme.colors.textLight}
                  />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  {selectedCategory} Services
                </Text>
                <TouchableOpacity
                  onPress={() => setSubcategoryModalVisible(false)}
                >
                  <Ionicons
                    name="close-outline"
                    size={28}
                    color={theme.colors.textLight}
                  />
                </TouchableOpacity>
              </LinearGradient>

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
                    <Text
                      style={[
                        styles.modalItemText,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      {item.name}
                    </Text>
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
            <View style={[styles.modalContainer, { ...theme.shadows.large }]}>
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.primaryDark]}
                style={styles.modalHeader}
              >
                <Text style={styles.modalTitle}>Select Rating</Text>
                <TouchableOpacity onPress={() => setRatingModalVisible(false)}>
                  <Ionicons
                    name="close-outline"
                    size={28}
                    color={theme.colors.textLight}
                  />
                </TouchableOpacity>
              </LinearGradient>

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
                      <Text
                        style={[
                          styles.modalItemText,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {item.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* Price Selection Modal */}
        <Modal
          transparent={true}
          visible={priceModalVisible}
          animationType="slide"
          onRequestClose={() => setPriceModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { ...theme.shadows.large }]}>
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.primaryDark]}
                style={styles.modalHeader}
              >
                <Text style={styles.modalTitle}>Select Price Range</Text>
                <TouchableOpacity onPress={() => setPriceModalVisible(false)}>
                  <Ionicons
                    name="close-outline"
                    size={28}
                    color={theme.colors.textLight}
                  />
                </TouchableOpacity>
              </LinearGradient>

              <FlatList
                data={[
                  { id: "all", name: "All Prices", value: "All" },
                  { id: "price-1", name: "$ (0-10)", value: "$" },
                  { id: "price-2", name: "$$ (10-20)", value: "$$" },
                  { id: "price-3", name: "$$$ (20-40)", value: "$$$" },
                ]}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => handlePriceSelect(item.value)}
                  >
                    <View style={styles.priceModalItem}>
                      <Text
                        style={[
                          styles.modalItemText,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {item.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* Distance Selection Modal */}
        <Modal
          transparent={true}
          visible={distanceModalVisible}
          animationType="slide"
          onRequestClose={() => setDistanceModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { ...theme.shadows.large }]}>
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.primaryDark]}
                style={styles.modalHeader}
              >
                <Text style={styles.modalTitle}>Select Distance</Text>
                <TouchableOpacity
                  onPress={() => setDistanceModalVisible(false)}
                >
                  <Ionicons
                    name="close-outline"
                    size={28}
                    color={theme.colors.textLight}
                  />
                </TouchableOpacity>
              </LinearGradient>

              <FlatList
                data={[
                  { id: "all", name: "All Distances", value: "All" },
                  { id: "distance-near", name: "Near (0-3 km)", value: "Near" },
                  {
                    id: "distance-medium",
                    name: "Medium (3-7 km)",
                    value: "Medium",
                  },
                  { id: "distance-far", name: "Far (>7 km)", value: "Far" },
                ]}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => handleDistanceSelect(item.value)}
                  >
                    <View style={styles.distanceModalItem}>
                      {item.value !== "All" && (
                        <Ionicons
                          name={
                            item.value === "Near"
                              ? "location"
                              : item.value === "Medium"
                              ? "navigate"
                              : "map"
                          }
                          size={20}
                          color={theme.colors.primary}
                          style={{ marginRight: 10 }}
                        />
                      )}
                      <Text
                        style={[
                          styles.modalItemText,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {item.name}
                      </Text>
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
  },
  headerContainer: {
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    paddingHorizontal: 16,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  locationButton: {
    marginRight: 8,
  },
  deliveryText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
  },
  addressText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    maxWidth: 280,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 12,
    marginBottom: 6,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  filtersSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    shadowColor: "rgba(0,0,0,0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 1,
  },
  filterButtonActive: {
    shadowOpacity: 0.5,
    elevation: 2,
  },
  filterButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "500",
  },
  filterButtonTextActive: {
    color: "#FFFFFF",
  },
  clearButton: {
    marginLeft: "auto",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  activeFiltersContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  activeFilterTag: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 5,
  },
  activeFilterTagText: {
    fontSize: 13,
    fontWeight: "500",
  },
  removeFilterIcon: {
    marginLeft: 6,
  },
  providersListContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  emptyResultsContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyResultsText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptyResultsSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  card: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 14,
    marginVertical: 8,
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  providerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  providerName: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  favoriteButton: {
    padding: 4,
  },
  detailsRow: {
    flexDirection: "row",
    marginVertical: 6,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  rating: {
    fontSize: 14,
    marginLeft: 4,
    color: "#555",
  },
  distanceText: {
    fontSize: 14,
    marginLeft: 4,
    color: "#555",
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
  },
  categoryBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "500",
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
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
  },
  backButton: {
    padding: 4,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  modalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  modalItemText: {
    fontSize: 16,
  },
  ratingModalItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  starsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  plusSign: {
    marginLeft: 4,
    color: "#666",
  },
  priceModalItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  distanceModalItem: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default HomeScreen;
