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
import { useTheme } from "../../theme/ThemeContext";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Header from "../../components/Header";

const sentimentAnalyzer = new Sentiment();

const ServiceProviderScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  // Check if route.params exists and has providerId
  const providerId = route.params?.providerId;

  console.log("Provider ID from params:", providerId);

  const [providerDetails, setProviderDetails] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("All");

  // Helper function to render stars based on rating
  const renderStars = (rating) => {
    const ratingNum = parseFloat(rating) || 0;
    const fullStars = Math.floor(ratingNum);
    const halfStar = ratingNum % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
      <View style={styles.starsContainer}>
        {[...Array(fullStars)].map((_, i) => (
          <Ionicons
            key={`full-${i}`}
            name="star"
            size={16}
            color="#FFD700"
            style={styles.starIcon}
          />
        ))}

        {halfStar && (
          <Ionicons
            key="half"
            name="star-half"
            size={16}
            color="#FFD700"
            style={styles.starIcon}
          />
        )}

        {[...Array(emptyStars)].map((_, i) => (
          <Ionicons
            key={`empty-${i}`}
            name="star-outline"
            size={16}
            color="#FFD700"
            style={styles.starIcon}
          />
        ))}

        <Text style={[styles.ratingText, { color: theme.colors.textLight }]}>
          {rating || "N/A"}
        </Text>
      </View>
    );
  };

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
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Header
          title="Service Provider"
          showBackButton
          onBackPress={handleBack}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textLight }]}>
            Loading provider details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!providerDetails) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Header
          title="Service Provider"
          showBackButton
          onBackPress={handleBack}
        />
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={60}
            color={theme.colors.error}
          />
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            Service provider not found
          </Text>
          <Text
            style={[styles.errorSubText, { color: theme.colors.textLight }]}
          >
            We couldn't find the details for this service provider
          </Text>
          <Button
            title="Go Back"
            icon="arrow-back-outline"
            onPress={handleBack}
            style={{ marginTop: 20 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const specialOffers = [
    { id: "1", title: "20% off on first service!", icon: "pricetag-outline" },
    { id: "2", title: "Free pickup & delivery", icon: "car-outline" },
    {
      id: "3",
      title: "Loyalty rewards for regular customers",
      icon: "gift-outline",
    },
  ];

  // Helper functions for review styling
  const getReviewStyle = (sentiment) => {
    switch (sentiment) {
      case "Positive":
        return { borderLeftColor: theme.colors.success };
      case "Negative":
        return { borderLeftColor: theme.colors.error };
      default:
        return { borderLeftColor: theme.colors.warning };
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
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 10 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>

        {/* Provider Header */}
        <Card style={styles.providerCard}>
          <View style={styles.header}>
            <Image
              source={{
                uri: providerDetails.image || "https://via.placeholder.com/140",
              }}
              style={styles.providerImage}
            />
            <View style={styles.headerTextContainer}>
              <Text style={[styles.providerName, { color: theme.colors.text }]}>
                {providerDetails.name || "Default Name"}
              </Text>
              {renderStars(providerDetails.rating)}
            </View>
          </View>

          <Text style={[styles.description, { color: theme.colors.text }]}>
            {providerDetails.description || "No description available"}
          </Text>
        </Card>

        {/* Special Offers */}
        <View style={styles.sectionHeader}>
          <Ionicons name="gift" size={20} color={theme.colors.primary} />
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Special Offers
          </Text>
        </View>

        <Card style={styles.offersCard}>
          {specialOffers.map((offer) => (
            <View key={offer.id} style={styles.offerItem}>
              <View
                style={[
                  styles.offerIconContainer,
                  { backgroundColor: theme.colors.primary + "15" },
                ]}
              >
                <Ionicons
                  name={offer.icon}
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
              <Text style={[styles.offerText, { color: theme.colors.text }]}>
                {offer.title}
              </Text>
            </View>
          ))}
        </Card>

        {/* Services */}
        <View style={styles.sectionHeader}>
          <Ionicons name="list" size={20} color={theme.colors.primary} />
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Services Offered
          </Text>
        </View>

        <Card style={styles.servicesCard}>
          {services.length > 0 ? (
            services.map((item) => (
              <View key={item.id} style={styles.serviceItem}>
                <View
                  style={[
                    styles.serviceIconContainer,
                    { backgroundColor: theme.colors.primary + "15" },
                  ]}
                >
                  <Ionicons
                    name="water-outline"
                    size={22}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.serviceTextContainer}>
                  <Text
                    style={[styles.serviceName, { color: theme.colors.text }]}
                  >
                    {item.name || "Service"}
                  </Text>
                  <Text
                    style={[
                      styles.servicePrice,
                      { color: theme.colors.primary },
                    ]}
                  >
                    ${item.price.toFixed(2) || "N/A"}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons
                name="list-outline"
                size={40}
                color={theme.colors.border}
              />
              <Text
                style={[
                  styles.noServicesText,
                  { color: theme.colors.textLight },
                ]}
              >
                No services available
              </Text>
            </View>
          )}
        </Card>

        {/* Reviews */}
        <View style={styles.sectionHeader}>
          <Ionicons
            name="chatbubble-ellipses"
            size={20}
            color={theme.colors.primary}
          />
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Reviews
          </Text>
        </View>

        <Card style={styles.reviewsCard}>
          {/* Filter Buttons */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScrollView}
            contentContainerStyle={styles.filterButtonsContainer}
          >
            {["All", "Positive", "Neutral", "Negative"].map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.filterButton,
                  {
                    backgroundColor:
                      selectedFilter === category
                        ? theme.colors.primary
                        : theme.colors.surface,
                  },
                ]}
                onPress={() => filterReviews(category)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    {
                      color:
                        selectedFilter === category
                          ? "#FFFFFF"
                          : theme.colors.text,
                    },
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Reviews List */}
          <View style={styles.reviewsContainer}>
            {filteredReviews.length > 0 ? (
              filteredReviews.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.reviewItem,
                    getReviewStyle(item.sentiment),
                    { backgroundColor: theme.colors.surface },
                  ]}
                >
                  <Text
                    style={[styles.reviewText, { color: theme.colors.text }]}
                  >
                    {item.comment}
                  </Text>
                  <View style={styles.reviewFooter}>
                    <View
                      style={[
                        styles.sentimentTag,
                        {
                          backgroundColor:
                            item.sentiment === "Positive"
                              ? theme.colors.success + "20"
                              : item.sentiment === "Negative"
                              ? theme.colors.error + "20"
                              : theme.colors.warning + "20",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.reviewSentiment,
                          {
                            color:
                              item.sentiment === "Positive"
                                ? theme.colors.success
                                : item.sentiment === "Negative"
                                ? theme.colors.error
                                : theme.colors.warning,
                          },
                        ]}
                      >
                        {getSentimentIcon(item.sentiment)} {item.sentiment}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.reviewDate,
                        { color: theme.colors.textLight },
                      ]}
                    >
                      {item.date
                        ? new Date(item.date.toDate()).toLocaleDateString()
                        : ""}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyStateContainer}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={40}
                  color={theme.colors.border}
                />
                <Text
                  style={[
                    styles.noReviewsText,
                    { color: theme.colors.textLight },
                  ]}
                >
                  No reviews available
                </Text>
              </View>
            )}
          </View>
        </Card>
      </ScrollView>

      {/* Order Button */}
      <View style={styles.bottomButtonContainer}>
        <Button
          title="Place Order"
          icon="cart-outline"
          onPress={handleOrderPlacement}
          style={styles.orderButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  backButton: {
    marginBottom: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubText: {
    fontSize: 14,
    textAlign: "center",
  },
  providerCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    marginBottom: 12,
  },
  providerImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  providerName: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 6,
  },
  starsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  starIcon: {
    marginRight: 2,
  },
  ratingText: {
    fontSize: 14,
    marginLeft: 4,
    fontWeight: "500",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  offersCard: {
    borderRadius: 16,
    marginBottom: 20,
    padding: 0,
    overflow: "hidden",
  },
  offerItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  offerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  offerText: {
    fontSize: 15,
    fontWeight: "500",
  },
  servicesCard: {
    borderRadius: 16,
    marginBottom: 20,
    padding: 16,
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  serviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: "500",
    marginTop: 2,
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  noServicesText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: "center",
  },
  reviewsCard: {
    borderRadius: 16,
    marginBottom: 20,
    padding: 0,
    overflow: "hidden",
  },
  filterScrollView: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  filterButtonsContainer: {
    padding: 12,
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 4,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  reviewsContainer: {
    padding: 16,
  },
  reviewItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  reviewText: {
    fontSize: 15,
    lineHeight: 20,
  },
  reviewFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  sentimentTag: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  reviewSentiment: {
    fontSize: 13,
    fontWeight: "600",
  },
  reviewDate: {
    fontSize: 12,
  },
  noReviewsText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: "center",
  },
  bottomButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  orderButton: {
    borderRadius: 12,
  },
});

export default ServiceProviderScreen;
