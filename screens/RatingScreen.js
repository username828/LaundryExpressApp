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

const CustomerFeedbackScreen = () => {
  const [rating, setRating] = useState(0); // Star rating
  const [review, setReview] = useState(""); // Review text

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert("Error", "Please select a star rating.");
      return;
    }
    if (!review.trim()) {
      Alert.alert("Error", "Please write a review.");
      return;
    }

    // Submit the review
    Alert.alert("Thank You!", "Your feedback has been submitted.");

    // Reset the form
    setRating(0);
    setReview("");
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => (
      <TouchableOpacity key={index} onPress={() => setRating(index + 1)}>
        <FontAwesome
          name={index < rating ? "star" : "star-o"}
          size={40}
          color={index < rating ? "#FFD700" : "#CCC"}
          style={styles.starIcon}
        />
      </TouchableOpacity>
    ));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>We value your feedback!</Text>
      <Text style={styles.subtitle}>How would you rate our service?</Text>

      {/* Star Rating Section */}
      <View style={styles.starContainer}>{renderStars()}</View>

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
    padding: 20,
    backgroundColor: "#f0f4f8",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    color: "#555",
    marginBottom: 20,
    textAlign: "center",
  },
  starContainer: {
    flexDirection: "row",
    marginBottom: 15,
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
    backgroundColor: "#007BFF",
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default CustomerFeedbackScreen;
