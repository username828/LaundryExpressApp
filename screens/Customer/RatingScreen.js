import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { db } from "../../firebaseConfig";
import { collection, doc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";

const auth = getAuth();

const feedbackCategories = ["Punctuality", "Clean Clothes", "Good Pricing", "Customer Service"];

const CustomerFeedbackScreen = ({ route }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]); // Track selected checkboxes

  const { orderId, providerId } = route.params;

  const navigation = useNavigation();
  const handleCategorySelection = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
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
      setRating(0);
      setReview("");
      setSelectedCategories([]);

      navigation.navigate("Home");
    } catch (error) {
      console.error("Error submitting review: ", error);
      Alert.alert("Error", "Failed to submit feedback.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>We value your feedback!</Text>
      <Text style={styles.subtitle}>How would you rate our service?</Text>

      {/* Star Rating */}
      <View style={styles.starContainer}>
        {[...Array(5)].map((_, index) => (
          <TouchableOpacity key={index} onPress={() => setRating(index + 1)}>
            <FontAwesome
              name={index < rating ? "star" : "star-o"}
              size={40}
              color={index < rating ? "#FFD700" : "#CCC"}
              style={styles.starIcon}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Feedback Categories */}
      <Text style={styles.label}>Select Feedback Categories:</Text>
      <View style={styles.checkboxContainer}>
        {feedbackCategories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[styles.checkbox, selectedCategories.includes(category) && styles.checkboxSelected]}
            onPress={() => handleCategorySelection(category)}
          >
            <Text style={[styles.checkboxText, selectedCategories.includes(category) && styles.checkboxTextSelected]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Review Input */}
      <Text style={styles.label}>Write your review:</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Share your experience..."
        placeholderTextColor="#aaa"
        multiline
        value={review}
        onChangeText={setReview}
      />

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Submit Review</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#555",
    marginBottom: 20,
    textAlign: "center",
  },
  starContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  starIcon: {
    marginHorizontal: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#555",
    alignSelf: "flex-start",
    marginBottom: 8,
    marginLeft: 16,
  },
  checkboxContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 15,
  },
  checkbox: {
    backgroundColor: "#EEE",
    padding: 10,
    borderRadius: 8,
    margin: 5,
  },
  checkboxSelected: {
    backgroundColor: "#007AFF",
  },
  checkboxText: {
    fontSize: 14,
    color: "#333",
  },
  checkboxTextSelected: {
    color: "#FFF",
  },
  textInput: {
    width: "100%",
    height: 100,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    textAlignVertical: "top",
    fontSize: 16,
    color: "#333",
    borderColor: "#ddd",
    borderWidth: 1,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default CustomerFeedbackScreen;
