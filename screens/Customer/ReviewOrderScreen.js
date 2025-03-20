import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { useTheme } from "../../theme/ThemeContext";
import Header from "../../components/Header";
import Button from "../../components/Button";

const ReviewOrderScreen = ({ route, navigation }) => {
  const { orderId, providerId } = route.params;
  const [order, setOrder] = useState(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const orderDoc = await getDoc(doc(db, "orders", orderId));
        if (orderDoc.exists()) {
          setOrder({ id: orderDoc.id, ...orderDoc.data() });
        }
      } catch (error) {
        console.error("Error fetching order:", error);
        Alert.alert("Error", "Could not fetch order details.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => setRating(i)}
          style={styles.starContainer}
        >
          <Ionicons
            name={i <= rating ? "star" : "star-outline"}
            size={32}
            color={i <= rating ? "#FFD700" : "#BDBDBD"}
          />
        </TouchableOpacity>
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert("Error", "Please select a rating.");
      return;
    }

    if (review.trim() === "") {
      Alert.alert("Error", "Please write a review.");
      return;
    }

    setSubmitting(true);

    try {
      // Add the review to the ratings collection
      await addDoc(collection(db, "ratings"), {
        orderId,
        serviceProviderId: providerId,
        customerId: auth.currentUser.uid,
        rating,
        review,
        createdAt: serverTimestamp(),
      });

      // Mark the order as reviewed
      await updateDoc(doc(db, "orders", orderId), {
        reviewed: true,
        reviewedAt: serverTimestamp(),
      });

      Alert.alert("Success", "Thank you for your review!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Error submitting review:", error);
      Alert.alert("Error", "Could not submit your review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Leave a Review" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Leave a Review" showBack />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Order not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (order.status !== "Delivered") {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Leave a Review" showBack />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Cannot review an order that hasn't been delivered yet.
          </Text>
          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
            style={{ marginTop: 16 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (order.reviewed) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Leave a Review" showBack />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            You have already reviewed this order.
          </Text>
          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
            style={{ marginTop: 16 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Leave a Review" showBack />
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>How was your experience?</Text>
          <Text style={styles.subtitle}>
            Your feedback helps us improve our service
          </Text>

          {/* Order Summary */}
          <View style={styles.orderSummary}>
            <Text style={styles.orderIdText}>
              Order #{order.orderId ? order.orderId : order.id.substring(0, 8)}
            </Text>
            <Text style={styles.dateText}>
              {order.createdAt
                ? new Date(order.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "N/A"}
            </Text>
          </View>

          {/* Rating Stars */}
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>Your Rating</Text>
            {renderStars()}
            <Text style={styles.ratingText}>
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
          </View>

          {/* Review Text */}
          <View style={styles.reviewContainer}>
            <Text style={styles.reviewLabel}>Your Review</Text>
            <TextInput
              style={styles.reviewInput}
              placeholder="Write your review here..."
              placeholderTextColor="#9E9E9E"
              multiline
              value={review}
              onChangeText={setReview}
              maxLength={500}
            />
            <Text style={styles.charCount}>{review.length}/500</Text>
          </View>

          {/* Submit Button */}
          <View style={styles.buttonContainer}>
            <Button
              title="Submit Review"
              onPress={handleSubmitReview}
              disabled={submitting || rating === 0 || review.trim() === ""}
              loading={submitting}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333333",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    marginBottom: 24,
  },
  orderSummary: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  orderIdText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: "#666666",
  },
  ratingContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
  },
  starContainer: {
    padding: 8,
  },
  ratingText: {
    fontSize: 14,
    color: "#666666",
    marginTop: 8,
  },
  reviewContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  reviewLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 16,
  },
  reviewInput: {
    backgroundColor: "#F9F9FB",
    borderRadius: 8,
    padding: 12,
    height: 120,
    textAlignVertical: "top",
    fontSize: 14,
    color: "#333333",
  },
  charCount: {
    fontSize: 12,
    color: "#9E9E9E",
    textAlign: "right",
    marginTop: 8,
  },
  buttonContainer: {
    marginBottom: 32,
  },
});

export default ReviewOrderScreen;
