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
import Card from "../../components/Card";

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
            color={i <= rating ? "#FFD700" : theme.colors.textLight}
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
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Header
          title="Leave a Review"
          leftIcon="arrow-back"
          onLeftPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textLight }]}>
            Loading order details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Header
          title="Leave a Review"
          leftIcon="arrow-back"
          onLeftPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={60}
            color={theme.colors.error}
          />
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            Order not found
          </Text>
          <Button
            title="Go Back"
            icon="arrow-back"
            onPress={() => navigation.goBack()}
            style={{ marginTop: 16 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (order.status !== "Delivered") {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Header
          title="Leave a Review"
          leftIcon="arrow-back"
          onLeftPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Ionicons
            name="information-circle-outline"
            size={60}
            color={theme.colors.warning}
          />
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            Cannot review an order that hasn't been delivered yet.
          </Text>
          <Button
            title="Go Back"
            icon="arrow-back"
            onPress={() => navigation.goBack()}
            style={{ marginTop: 16 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (order.reviewed) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Header
          title="Leave a Review"
          leftIcon="arrow-back"
          onLeftPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Ionicons
            name="checkmark-circle-outline"
            size={60}
            color={theme.colors.success}
          />
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            You have already reviewed this order.
          </Text>
          <Button
            title="Go Back"
            icon="arrow-back"
            onPress={() => navigation.goBack()}
            style={{ marginTop: 16 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Header
        title="Leave a Review"
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>
          How was your experience?
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textLight }]}>
          Your feedback helps us improve our service
        </Text>

        {/* Order Summary */}
        <Card style={styles.card}>
          <View style={styles.orderHeader}>
            <Text style={[styles.orderIdText, { color: theme.colors.primary }]}>
              Order #
              {order.orderId
                ? order.orderId.substring(0, 8)
                : order.id.substring(0, 8)}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: theme.colors.success },
              ]}
            >
              <Text style={[styles.statusText, { color: theme.colors.white }]}>
                {order.status}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.orderDetail}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color={theme.colors.textLight}
              />
              <Text
                style={[styles.orderDetailText, { color: theme.colors.text }]}
              >
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "N/A"}
              </Text>
            </View>
          </View>
        </Card>

        {/* Rating Stars */}
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Your Rating
          </Text>
          {renderStars()}
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
        </Card>

        {/* Review Text */}
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Your Review
          </Text>
          <TextInput
            style={[
              styles.reviewInput,
              { backgroundColor: theme.colors.card, color: theme.colors.text },
            ]}
            placeholder="Write your review here..."
            placeholderTextColor={theme.colors.textLight}
            multiline
            value={review}
            onChangeText={setReview}
            maxLength={500}
          />
          <Text style={[styles.charCount, { color: theme.colors.textLight }]}>
            {review.length}/500
          </Text>
        </Card>

        {/* Submit Button */}
        <View style={styles.buttonContainer}>
          <Button
            title="Submit Review"
            icon="send"
            onPress={handleSubmitReview}
            disabled={submitting || rating === 0 || review.trim() === ""}
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
    padding: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
    maxWidth: "80%",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderIdText: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  orderDetail: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderDetailText: {
    marginLeft: 8,
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 8,
  },
  starContainer: {
    padding: 8,
  },
  ratingText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
  },
  reviewInput: {
    borderRadius: 12,
    padding: 16,
    height: 120,
    textAlignVertical: "top",
    fontSize: 16,
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    textAlign: "right",
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
});

export default ReviewOrderScreen;
