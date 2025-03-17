import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  getDoc,
  doc,
  query,
  where,
  getDocs,
  collection,
} from "firebase/firestore";
import { MaterialCommunityIcons, Ionicons } from "react-native-vector-icons";
import Sentiment from "sentiment";
import { db } from "../../firebaseConfig";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const sentimentAnalyzer = new Sentiment();

const ServiceProviderScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Check if route.params exists and has providerId
  const providerId = route.params?.providerId;

  console.log("Provider ID from params:", providerId);

  const [providerDetails, setProviderDetails] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("All");

  useEffect(() => {
    // If providerId is missing, show an error and go back
    if (!providerId) {
      Alert.alert(
        "Error",
        "Service provider information is missing. Please try again.",
        [{ text: "Go Back", onPress: () => navigation.goBack() }]
      );
      setLoading(false);
      return;
    }

    const fetchProviderDetails = async () => {
      try {
        console.log("Fetching provider details for ID:", providerId);
        const docRef = doc(db, "serviceProviders", providerId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log("Provider data retrieved successfully");
          setProviderDetails(data);
        } else {
          console.log("No provider document found");
          Alert.alert("Error", "Service provider not found");
        }
      } catch (error) {
        console.error("Error fetching provider details: ", error);
        Alert.alert("Error", "Failed to load service provider details");
      }
    };

    const fetchServices = async () => {
      try {
        console.log("Fetching services for provider ID:", providerId);

        // Query the services collection for this provider
        const servicesQuery = query(
          collection(db, "services"),
          where("providerId", "==", providerId)
        );

        const querySnapshot = await getDocs(servicesQuery);
        console.log(`Retrieved ${querySnapshot.docs.length} service documents`);

        const fetchedServices = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setServices(fetchedServices);
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };

    const fetchReviews = async () => {
      try {
        console.log("Fetching reviews for provider ID:", providerId);

        const reviewsQuery = query(
          collection(db, "ratings"),
          where("serviceProviderId", "==", providerId)
        );

        const querySnapshot = await getDocs(reviewsQuery);
        console.log(`Retrieved ${querySnapshot.docs.length} review documents`);

        const fetchedReviews = querySnapshot.docs.map((doc) => {
          const reviewData = doc.data();
          const comment = reviewData.comment || "";
          const sentimentScore = sentimentAnalyzer.analyze(comment).score;

          let sentimentCategory = "Neutral";
          if (sentimentScore > 1) {
            sentimentCategory = "Positive";
          } else if (sentimentScore < -1) {
            sentimentCategory = "Negative";
          }

          return { id: doc.id, ...reviewData, sentiment: sentimentCategory };
        });

        console.log(
          `Processed ${fetchedReviews.length} reviews with sentiment analysis`
        );
        setReviews(fetchedReviews);
        setFilteredReviews(fetchedReviews);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    };

    const loadData = async () => {
      await fetchProviderDetails();
      await fetchServices(); // Fetch services from the services collection
      await fetchReviews();
      setLoading(false);
    };

    loadData();
  }, [providerId, navigation]);

  const filterReviews = (category) => {
    setSelectedFilter(category);
    if (category === "All") {
      setFilteredReviews(reviews);
    } else {
      setFilteredReviews(
        reviews.filter((review) => review.sentiment === category)
      );
    }
  };

  const handleOrderPlacement = () => {
    navigation.navigate("OrderPlacement", {
      providerId,
      availableServices: services,
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </SafeAreaView>
    );
  }

  if (!providerDetails) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorMessage}>Service provider not found.</Text>
      </SafeAreaView>
    );
  }

  const specialOffers = [
    { id: "1", title: "20% off on first service!", icon: "percent" },
    { id: "2", title: "Free pickup & delivery", icon: "truck" },
    { id: "3", title: "Loyalty rewards for regular customers", icon: "gift" },
  ];

  // Helper functions for review styling
  const getReviewStyle = (sentiment) => {
    switch (sentiment) {
      case "Positive":
        return { borderLeftColor: "#4CD964" }; // Green
      case "Negative":
        return { borderLeftColor: "#FF3B30" }; // Red
      default:
        return { borderLeftColor: "#FFCC00" }; // Yellow for Neutral
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case "Positive":
        return "😊";
      case "Negative":
        return "😞";
      default:
        return "😐";
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={[styles.container, { paddingTop: insets.top > 0 ? 0 : 20 }]}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Provider Header */}
          <View style={styles.header}>
            <Image
              source={{
                uri: providerDetails.image || "https://via.placeholder.com/140",
              }}
              style={styles.providerImage}
            />
            <View style={styles.headerTextContainer}>
              <Text style={styles.providerName}>
                {providerDetails.name || "Default Name"}
              </Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={18} color="#FFD700" />
                <Text style={styles.rating}>
                  {providerDetails.rating || "N/A"}
                </Text>
              </View>
              <Text style={styles.description}>
                {providerDetails.description || "No description available"}
              </Text>
            </View>
          </View>

          {/* Special Offers */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Offers</Text>
            {specialOffers.map((offer) => (
              <View key={offer.id} style={styles.offerItem}>
                <Ionicons
                  name="gift-outline"
                  size={22}
                  color="#3498db"
                  style={styles.offerIcon}
                />
                <Text style={styles.offerText}>{offer.title}</Text>
              </View>
            ))}
          </View>

          {/* Services */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services Offered</Text>
            {services.length > 0 ? (
              services.map((item) => (
                <View key={item.id} style={styles.serviceItem}>
                  <View style={styles.serviceIconContainer}>
                    <Ionicons name="water-outline" size={24} color="#3498db" />
                  </View>
                  <View style={styles.serviceTextContainer}>
                    <Text style={styles.serviceName}>
                      {item.name || "Service"}
                    </Text>
                    <Text style={styles.servicePrice}>
                      ${item.price.toFixed(2) || "N/A"}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noServicesText}>No services available</Text>
            )}
          </View>

          {/* Reviews */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reviews</Text>

            {/* Filter Buttons */}
            <View style={styles.filterButtonsContainer}>
              {["All", "Positive", "Neutral", "Negative"].map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.filterButton,
                    selectedFilter === category && styles.filterButtonActive,
                  ]}
                  onPress={() => filterReviews(category)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      selectedFilter === category &&
                        styles.filterButtonTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Reviews List */}
            {filteredReviews.length > 0 ? (
              filteredReviews.map((item) => (
                <View
                  key={item.id}
                  style={[styles.reviewItem, getReviewStyle(item.sentiment)]}
                >
                  <Text style={styles.reviewText}>{item.comment}</Text>
                  <View style={styles.reviewFooter}>
                    <Text style={styles.reviewSentiment}>
                      {getSentimentIcon(item.sentiment)} {item.sentiment}
                    </Text>
                    <Text style={styles.reviewDate}>
                      {item.date
                        ? new Date(item.date.toDate()).toLocaleDateString()
                        : ""}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noReviewsText}>No reviews available</Text>
            )}
          </View>
        </ScrollView>

        {/* Order Button */}
        <TouchableOpacity
          style={styles.orderButton}
          onPress={handleOrderPlacement}
        >
          <Text style={styles.orderButtonText}>Place Order</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  errorMessage: {
    fontSize: 16,
    color: "#FF3B30",
    textAlign: "center",
    padding: 20,
  },
  backButton: {
    padding: 12,
    marginLeft: 8,
  },
  header: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  providerImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  providerName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  rating: {
    fontSize: 16,
    color: "#555",
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 8,
  },
  offerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  offerIcon: {
    marginRight: 12,
  },
  offerText: {
    fontSize: 15,
    color: "#555",
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 12,
    marginVertical: 6,
  },
  serviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e3f2fd",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  serviceTextContainer: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  servicePrice: {
    fontSize: 15,
    color: "#3498db",
    fontWeight: "500",
    marginTop: 2,
  },
  noServicesText: {
    textAlign: "center",
    marginTop: 10,
    color: "#888",
    fontStyle: "italic",
  },
  filterButtonsContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: "#3498db",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#555",
  },
  filterButtonTextActive: {
    color: "white",
  },
  reviewItem: {
    padding: 12,
    borderRadius: 12,
    marginVertical: 6,
    backgroundColor: "#f8f9fa",
    borderLeftWidth: 4,
  },
  reviewText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 20,
  },
  reviewFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  reviewSentiment: {
    fontSize: 14,
    fontWeight: "500",
  },
  reviewDate: {
    fontSize: 12,
    color: "#888",
  },
  noReviewsText: {
    textAlign: "center",
    marginTop: 10,
    color: "#888",
    fontStyle: "italic",
  },
  orderButton: {
    backgroundColor: "#3498db",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ServiceProviderScreen;
