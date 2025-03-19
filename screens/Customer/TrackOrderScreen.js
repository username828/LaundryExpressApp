import React, { useState, useEffect } from "react";
import Toast from "react-native-toast-message";

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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const TrackOrderScreen = ({ route }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { orderId, providerId } = route.params;

  const [orderSteps, setOrderSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(null);
  const fadeAnim = new Animated.Value(1); // Start at full opacity

  const [ratingModalVisible, setRatingModalVisible] = useState(false);

  const allSteps = [
    {
      id: "ordered",
      label: "Order Placed",
      icon: "checkmark-circle-outline",
      color: "#34C759",
    },
    { id: "pickedUp", label: "Picked Up", icon: "cart", color: "#FF9500" },
    { id: "washing", label: "Washing", icon: "water", color: "#5AC8FA" },
    { id: "ironing", label: "Ironing", icon: "shirt", color: "#FF3B30" },
    {
      id: "dispatched",
      label: "Out for Delivery",
      icon: "bus",
      color: "#007AFF",
    },
    { id: "delivered", label: "Delivered", icon: "home", color: "#4CD964" },
  ];

  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        const { status: newStatus } =
          await Notifications.requestPermissionsAsync();
        if (newStatus !== "granted") {
          Alert.alert(
            "Notification Permission",
            "Please enable notifications in settings."
          );
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

        setOrderSteps(steps);
        setCurrentStep(orderData.status);
      } else {
        setOrderSteps([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [orderId,currentStep]);

  const sendPushNotification = async (status) => {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
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
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={[styles.header, { marginTop: insets.top > 0 ? 0 : 20 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Track Your Order</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.orderInfoCard}>
        <Text style={styles.orderId}>Order ID: {orderId}</Text>
        <View style={styles.divider} />
        <Text style={styles.orderNote}>
          Real-time updates will appear as your order progresses
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading order status...</Text>
        </View>
      ) : (
        <FlatList
          data={orderSteps}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <Animated.View
              style={[styles.stepContainer, { opacity: fadeAnim }]}
            >
              <View style={styles.timeline}>
                <View
                  style={[
                    styles.iconContainer,
                    item.completed
                      ? { backgroundColor: item.color }
                      : styles.incompleteIcon,
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={24}
                    color={item.completed ? "#FFFFFF" : "#B0BEC5"}
                  />
                </View>
                {index !== orderSteps.length - 1 && (
                  <View
                    style={[
                      styles.line,
                      item.completed && { backgroundColor: item.color },
                    ]}
                  />
                )}
              </View>
              <View style={styles.stepDetails}>
                <Text
                  style={[
                    styles.stepLabel,
                    item.completed && { color: item.color, fontWeight: "600" },
                  ]}
                >
                  {item.label}
                </Text>
                {item.completed && (
                  <Text style={styles.stepTime}>
                    {new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                )}
              </View>
            </Animated.View>
          )}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            <>
              <View style={styles.statusContainer}>
                <Text style={styles.statusText}>Current Status:</Text>
                <Text style={[styles.statusValue, getStatusStyle(currentStep)]}>
                  {currentStep || "Pending"}
                </Text>
              </View>
              {currentStep === "Delivered" && (
                <TouchableOpacity
                  style={styles.ratingButton}
                  onPress={() =>
                    navigation.navigate("Rating", { orderId, providerId })
                  }
                >
                  <Ionicons name="star" size={24} color="#FFFFFF" />
                  <Text style={styles.ratingButtonText}>
                    Rate Your Experience
                  </Text>
                </TouchableOpacity>
              )}
            </>
          }
        />
      )}
    </SafeAreaView>
  );
};

const getStatusStyle = (currentStep) => {
  switch (currentStep) {
    case "Order Placed":
      return { color: "#34C759" };
    case "Picked Up":
      return { color: "#FF9500" };
    case "Washing":
      return { color: "#5AC8FA" };
    case "Ironing":
      return { color: "#FF3B30" };
    case "Out for Delivery":
      return { color: "#007AFF" };
    case "Delivered":
      return { color: "#4CD964" };
    default:
      return { color: "#8E8E93" };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  backButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
  },
  orderInfoCard: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderId: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E5EA",
    marginVertical: 12,
  },
  orderNote: {
    fontSize: 13,
    color: "#8E8E93",
    textAlign: "center",
    fontStyle: "italic",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#8E8E93",
  },
  listContent: {
    paddingBottom: 30,
    paddingTop: 10,
  },
  stepContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  timeline: {
    flexDirection: "column",
    alignItems: "center",
    width: 40,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  incompleteIcon: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  line: {
    width: 2,
    height: 40,
    backgroundColor: "#E5E5EA",
  },
  stepDetails: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#3C3C43",
    marginBottom: 4,
  },
  stepTime: {
    fontSize: 13,
    color: "#8E8E93",
  },
  statusContainer: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#8E8E93",
    marginBottom: 8,
  },
  statusValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  ratingButton: {
    backgroundColor: "#FF9500",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 40,
    marginTop: 16,
    shadowColor: "#FF9500",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  ratingButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
});

export default TrackOrderScreen;