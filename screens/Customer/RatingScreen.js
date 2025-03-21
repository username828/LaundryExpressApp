import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";
import { db } from "../../firebaseConfig";
import {
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../theme/ThemeContext";
import Header from "../../components/Header";
import Button from "../../components/Button";

const auth = getAuth();

const updateServiceProviderRating = async (serviceProviderId) => {
  try {
    // Step 1: Fetch all ratings for the given service provider
    const ratingsQuery = query(
      collection(db, "ratings"),
      where("serviceProviderId", "==", serviceProviderId)
    );

    const ratingsSnapshot = await getDocs(ratingsQuery);
    const ratingsList = ratingsSnapshot.docs.map((doc) => doc.data().rating);

    if (ratingsList.length === 0) return; // No ratings, do nothing

    // Step 2: Calculate the new average rating
    const totalRatings = ratingsList.length;
    const sumRatings = ratingsList.reduce((sum, rating) => sum + rating, 0);
    const newAverageRating = sumRatings / totalRatings;

    // Step 3: Update the service provider's rating
    const serviceProviderRef = doc(db, "serviceProviders", serviceProviderId);
    await updateDoc(serviceProviderRef, {
      rating: parseFloat(newAverageRating.toFixed(1)), // Store as one decimal place
    });

    console.log(
      `Updated rating for provider ${serviceProviderId}: ${newAverageRating}`
    );
  } catch (error) {
    console.error("Error updating service provider rating:", error);
  }
};

const feedbackCategories = [
  "Punctuality",
  "Clean Clothes",
  "Good Pricing",
  "Customer Service",
];

const CustomerFeedbackScreen = ({ route }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const { orderId, providerId } = route.params;
  const navigation = useNavigation();
  const theme = useTheme();

  const handleCategorySelection = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert("Error", "Please select a star rating.");
      return;
    }
    if (!review.trim()) {
      Alert.alert("Error", "Please write a review.");
      return;
    }
    if (selectedCategories.length === 0) {
      Alert.alert("Error", "Please select at least one feedback category.");
      return;
    }

    setSubmitting(true);

    try {
      const ratingRef = doc(collection(db, "ratings"));
      const ratingId = ratingRef.id;
      const ratingData = {
        ratingId,
        rating,
        comment: review,
        categories: selectedCategories,
        createdAt: new Date().toISOString(),
        customerId: auth.currentUser?.uid,
        serviceProviderId: providerId,
        orderId: orderId,
      };

      await setDoc(ratingRef, ratingData);

      Alert.alert("Thank You!", "Your feedback has been submitted.");
      //update rating in service provider function
      await updateServiceProviderRating(providerId);
      setRating(0);
      setReview("");
      setSelectedCategories([]);

      navigation.navigate("Home");
    } catch (error) {
      console.error("Error submitting review: ", error);
      Alert.alert("Error", "Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Header
        title="Rate Your Experience"
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>
          We value your feedback!
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textLight }]}>
          How would you rate our service?
        </Text>

        {/* Star Rating */}
        <View style={styles.starContainer}>
          {[...Array(5)].map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setRating(index + 1)}
              style={styles.starItem}
            >
              <FontAwesome
                name={index < rating ? "star" : "star-o"}
                size={40}
                color={index < rating ? "#FFD700" : theme.colors.textLight}
                style={[
                  styles.starIcon,
                  {
                    textShadowColor: "rgba(0, 0, 0, 0.75)",
                    textShadowOffset: { width: -1, height: 1 },
                    textShadowRadius: 1,
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.ratingText, { color: theme.colors.textLight }]}>
          {rating === 0
            ? "Tap to rate"
            : rating === 1
            ? "Poor"
            : rating === 2
            ? "Fair"
            : rating === 3
            ? "Good"
            : rating === 4
            ? "Very Good"
            : "Excellent"}
        </Text>

        {/* Feedback Categories */}
        <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
          Select Feedback Categories:
        </Text>
        <View style={styles.categoriesContainer}>
          {feedbackCategories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryBadge,
                selectedCategories.includes(category) && {
                  backgroundColor: theme.colors.primaryLight,
                  borderColor: theme.colors.primary,
                },
              ]}
              onPress={() => handleCategorySelection(category)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategories.includes(category) && {
                    color: "#FFFFFF",
                    fontWeight: "600",
                  },
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Review Input */}
        <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
          Write your review:
        </Text>
        <TextInput
          style={[
            styles.reviewInput,
            {
              backgroundColor: "#FFFFFF",
              color: theme.colors.text,
              borderColor: theme.colors.border,
            },
          ]}
          placeholder="Share your experience..."
          placeholderTextColor={theme.colors.textLight}
          multiline
          value={review}
          onChangeText={setReview}
          maxLength={500}
        />
        <Text style={[styles.charCount, { color: theme.colors.textLight }]}>
          {review.length}/500
        </Text>

        {/* Submit Button */}
        <View style={styles.buttonContainer}>
          <Button
            title="Submit Review"
            icon="send"
            onPress={handleSubmit}
            disabled={
              submitting ||
              rating === 0 ||
              review.trim() === "" ||
              selectedCategories.length === 0
            }
            loading={submitting}
          />
        </View>
      </ScrollView>
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
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  starContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  starItem: {
    padding: 5,
  },
  starIcon: {
    marginHorizontal: 5,
  },
  ratingText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 25,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 12,
    marginLeft: 4,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 25,
  },
  categoryBadge: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    margin: 4,
    backgroundColor: "#F0F8FF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  categoryText: {
    fontSize: 14,
    color: "#666",
  },
  reviewInput: {
    borderRadius: 12,
    padding: 16,
    height: 120,
    textAlignVertical: "top",
    fontSize: 16,
    marginBottom: 8,
    borderWidth: 1,
  },
  charCount: {
    fontSize: 12,
    textAlign: "right",
    marginBottom: 20,
  },
  buttonContainer: {
    marginBottom: 16,
  },
});

export default CustomerFeedbackScreen;
