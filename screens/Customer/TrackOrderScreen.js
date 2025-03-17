import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { firestore } from "../../firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
import * as Notifications from "expo-notifications";


const TrackOrderScreen = ({ route }) => {
  const navigation = useNavigation();
  const { orderId, providerId } = route.params;

  const [orderSteps, setOrderSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(null);
  const fadeAnim = new Animated.Value(1); // Start at full opacity

  const [ratingModalVisible, setRatingModalVisible] = useState(false);

  const allSteps = [
    { id: "ordered", label: "Order Placed", icon: "checkmark-circle-outline" },
    { id: "pickedUp", label: "Picked Up", icon: "cart" },
    { id: "washing", label: "Washing", icon: "water" },
    { id: "ironing", label: "Ironing", icon: "shirt" },
    { id: "dispatched", label: "Out for Delivery", icon: "bus" },
    { id: "delivered", label: "Delivered", icon: "home" },
  ];

  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== "granted") {
          Alert.alert("Notification Permission", "Please enable notifications in settings.");
          return;
        }
      }
    };
  
    requestPermissions();
  }, []);
  useEffect(() => {
    const orderRef = doc(firestore, "orders", orderId);
    const unsubscribe = onSnapshot(orderRef, (doc) => {
      if (doc.exists()) {
        const orderData = doc.data();
        const activeStepIndex = allSteps.findIndex(
          (step) => step.label === orderData.status
        );

        const steps = allSteps.map((step, index) => ({
          ...step,
          completed: index <= activeStepIndex,
        }));

        if (orderData.status !== currentStep) {
          sendPushNotification(orderData.status);
        }

        setOrderSteps(steps);
        setCurrentStep(orderData.status);
      } else {
        setOrderSteps([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [orderId]);

  const sendPushNotification = async (status) => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus !== "granted") {
      console.log("Notification permission not granted.");
      return;
    }
  
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Order Update",
        body: `Your order is now ${status}.`,
        sound: "default",
      },
      trigger: null, // Instant notification
    });
  
    console.log("Local Notification Sent!");
  };
  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Track Your Order</Text>
      <Text style={styles.orderId}>Order ID: {orderId}</Text>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#007AFF"
          style={{ marginTop: 20 }}
        />
      ) : (
        <FlatList
          data={orderSteps}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <Animated.View
              style={[styles.stepContainer, { opacity: fadeAnim }]}
            >
              <View style={styles.timeline}>
                <Ionicons
                  name={item.icon}
                  size={30}
                  color={item.completed ? "#007AFF" : "#B0BEC5"}
                />
                {index !== orderSteps.length - 1 && (
                  <View
                    style={[
                      styles.line,
                      item.completed && styles.completedLine,
                    ]}
                  />
                )}
              </View>
              <View style={styles.stepDetails}>
                <Text
                  style={[
                    styles.stepLabel,
                    item.completed && styles.completedText,
                  ]}
                >
                  {item.label}
                </Text>
              </View>
            </Animated.View>
          )}
          contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }} // Fix spacing
          ListFooterComponent={
            <>
              <View style={styles.statusContainer}>
                <Text style={styles.statusText}>Current Status:</Text>
                <Text style={[styles.statusValue, getStatusStyle(currentStep)]}>
                  {currentStep || "Pending"}
                </Text>
              </View>
              {currentStep === "Delivered" && (
                <>
                  <TouchableOpacity
                    style={styles.ratingButton}
                    onPress={() =>
                      navigation.navigate("Rating", { orderId, providerId })
                    }
                  >
                    <Ionicons name="star" size={24} color="gold" />
                    <Text style={styles.ratingButtonText}>Give a Rating</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          }
        />
      )}
    </View>
  );
};

const getStatusStyle = (currentStep) => {
  switch (currentStep) {
    case "Order Placed":
      return { color: "#555" };
    case "Picked Up":
      return { color: "#FFA500" };
    case "Washing":
      return { color: "#4682B4" };
    case "Ironing":
      return { color: "#8B4513" };
    case "Out for Delivery":
      return { color: "#FF4500" };
    case "Delivered":
      return { color: "#008000" };
    default:
      return { color: "gray" };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f8f8",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  orderId: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
    color: "#555",
  },
  stepContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#fff", // Add background for visibility
    padding: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  timeline: {
    flexDirection: "column",
    alignItems: "center",
    marginRight: 15,
  },
  line: {
    width: 2,
    height: 30,
    backgroundColor: "#B0BEC5",
  },
  completedLine: {
    backgroundColor: "#007AFF",
  },
  stepDetails: {
    flex: 1,
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  completedText: {
    color: "#007AFF",
  },
  statusContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    alignItems: "center",
  },
  statusText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
  },
  statusValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 5,
  },
  buttonContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  ratingButton: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 25,
    marginTop: 20,
    alignSelf: "center",
    width: "80%",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  ratingButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
});

export default TrackOrderScreen;
