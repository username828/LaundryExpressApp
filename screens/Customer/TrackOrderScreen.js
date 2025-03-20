import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Alert,
  Dimensions,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { firestore } from "../../firebaseConfig";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import * as Notifications from "expo-notifications";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

// Order status constants
const ORDER_STATUS = {
  PENDING: "Order Placed",
  PICKED_UP: "Picked Up",
  PROCESSING: "Order Processing",
  DISPATCHED: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const TrackOrderScreen = ({ route }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { orderId, providerId } = route.params;

  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const allSteps = [
    {
      id: "ordered",
      label: ORDER_STATUS.PENDING,
      icon: "checkmark-circle-outline",
      color: "#FFA500",
    },
    {
      id: "pickedUp",
      label: ORDER_STATUS.PICKED_UP,
      icon: "cart",
      color: "#FF9500",
    },
    {
      id: "processing",
      label: ORDER_STATUS.PROCESSING,
      icon: "construct",
      color: "#5AC8FA",
    },
    {
      id: "dispatched",
      label: ORDER_STATUS.DISPATCHED,
      icon: "bicycle",
      color: "#007AFF",
    },
    {
      id: "delivered",
      label: ORDER_STATUS.DELIVERED,
      icon: "checkmark-done-circle",
      color: "#4CD964",
    },
  ];

  // Start pulse animation for the next incomplete step
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Start progress line animation between steps
  const animateProgressLine = (currentStepIndex) => {
    progressAnim.setValue(currentStepIndex);

    // Only animate to next step if not at the last step
    if (currentStepIndex < allSteps.length - 1) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(progressAnim, {
            toValue: currentStepIndex + 0.5,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(progressAnim, {
            toValue: currentStepIndex,
            duration: 800,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  };

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
        const data = doc.data();
        setOrderData(data);

        // Find the current step index
        const currentIndex = allSteps.findIndex(
          (step) => step.label === data.status
        );
        setCurrentStep(data.status);

        // Start animations
        if (currentIndex >= 0) {
          startPulseAnimation();
          animateProgressLine(currentIndex);
        }
      } else {
        setOrderData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [orderId]);

  const getStatusStyle = (status) => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        return { color: "#FFA500" };
      case ORDER_STATUS.PICKED_UP:
        return { color: "#FF9500" };
      case ORDER_STATUS.PROCESSING:
        return { color: "#5AC8FA" };
      case ORDER_STATUS.DISPATCHED:
        return { color: "#007AFF" };
      case ORDER_STATUS.DELIVERED:
        return { color: "#4CD964" };
      case ORDER_STATUS.CANCELLED:
        return { color: "#FF3B30" };
      default:
        return { color: "#8E8E93" };
    }
  };

  const renderTimeline = () => {
    if (!orderData) return null;

    const currentStepIndex = allSteps.findIndex(
      (step) => step.label === currentStep
    );

    return (
      <View style={styles.timelineContainer}>
        {allSteps.map((step, index) => {
          const isCompleted = index <= currentStepIndex;
          const isActive = index === currentStepIndex;
          const isNext = index === currentStepIndex + 1;

          // Determine if this step has a connecting line to the next step
          const hasNextLine = index < allSteps.length - 1;

          return (
            <View key={step.id} style={styles.stepRow}>
              <View style={styles.stepIconContainer}>
                {/* Step Icon */}
                <Animated.View
                  style={[
                    styles.stepIcon,
                    {
                      backgroundColor: isCompleted ? step.color : "#E5E5EA",
                      transform: [{ scale: isNext ? pulseAnim : 1 }],
                    },
                  ]}
                >
                  <Ionicons
                    name={step.icon}
                    size={22}
                    color={isCompleted ? "#FFFFFF" : "#8E8E93"}
                  />
                </Animated.View>

                {/* Connecting Line */}
                {hasNextLine && (
                  <View style={styles.lineContainer}>
                    <View
                      style={[styles.line, { backgroundColor: "#E5E5EA" }]}
                    />

                    {/* Animated progress line overlay */}
                    {isCompleted && (
                      <Animated.View
                        style={[
                          styles.progressLine,
                          {
                            backgroundColor: step.color,
                            height: progressAnim.interpolate({
                              inputRange: [index, index + 1],
                              outputRange: ["0%", "100%"],
                              extrapolate: "clamp",
                            }),
                          },
                        ]}
                      />
                    )}
                  </View>
                )}
              </View>

              {/* Step Label */}
              <View style={styles.stepDetails}>
                <Text
                  style={[
                    styles.stepLabel,
                    isCompleted ? { color: step.color, fontWeight: "600" } : {},
                  ]}
                >
                  {step.label}
                </Text>
                {isActive && (
                  <Text style={styles.activeStepText}>Current Status</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const handleCancelOrder = () => {
    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: async () => {
          try {
            const orderRef = doc(firestore, "orders", orderId);
            await updateDoc(orderRef, {
              status: ORDER_STATUS.CANCELLED,
            });
            Alert.alert("Success", "Your order has been cancelled.");
          } catch (error) {
            console.error("Error cancelling order:", error);
            Alert.alert("Error", "Failed to cancel order. Please try again.");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={[styles.header, { marginTop: insets.top > 0 ? 0 : 20 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333333" />
          </TouchableOpacity>
          <Text style={styles.title}>Track Your Order</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#333333" />
          <Text style={styles.loadingText}>Loading order status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={[styles.header, { marginTop: insets.top > 0 ? 0 : 20 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.title}>Track Your Order</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.orderInfoCard}>
        <Text style={styles.orderId}>Order #{orderId.substring(0, 8)}</Text>
        <View style={styles.divider} />
        <Text style={styles.orderNote}>
          Real-time updates will appear as your order progresses
        </Text>
      </View>

      <View style={styles.mainContent}>
        {renderTimeline()}

        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>Current Status:</Text>
          <Text style={[styles.statusValue, getStatusStyle(currentStep)]}>
            {currentStep || "Pending"}
          </Text>
        </View>

        {currentStep === ORDER_STATUS.PENDING && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelOrder}
          >
            <Ionicons name="close-circle" size={20} color="#FFFFFF" />
            <Text style={styles.cancelButtonText}>Cancel Order</Text>
          </TouchableOpacity>
        )}

        {currentStep === ORDER_STATUS.DELIVERED && (
          <TouchableOpacity
            style={styles.ratingButton}
            onPress={() =>
              navigation.navigate("Rating", { orderId, providerId })
            }
          >
            <Ionicons name="star" size={20} color="#FFFFFF" />
            <Text style={styles.ratingButtonText}>Rate Your Experience</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
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
    color: "#333333",
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
    color: "#333333",
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#EFEFEF",
    marginVertical: 12,
  },
  orderNote: {
    fontSize: 13,
    color: "#8E8E93",
    textAlign: "center",
    fontStyle: "italic",
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: "space-between",
    paddingBottom: 20,
  },
  timelineContainer: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: 20,
    maxHeight: height * 0.5,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  stepIconContainer: {
    alignItems: "center",
    width: 40,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  lineContainer: {
    height: 30,
    width: 2,
    position: "relative",
    alignSelf: "center",
  },
  line: {
    position: "absolute",
    width: 2,
    height: "100%",
    backgroundColor: "#E5E5EA",
  },
  progressLine: {
    position: "absolute",
    width: 2,
    bottom: 0,
    backgroundColor: "#4CD964",
    zIndex: 1,
  },
  stepDetails: {
    flex: 1,
    paddingLeft: 16,
    justifyContent: "center",
    paddingVertical: 6,
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333333",
    marginBottom: 2,
  },
  activeStepText: {
    fontSize: 13,
    color: "#8E8E93",
    fontStyle: "italic",
  },
  statusContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
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
    color: "#333333",
  },
  ratingButton: {
    backgroundColor: "#333333",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ratingButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
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
  cancelButton: {
    backgroundColor: "#FF3B30",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
});

export default TrackOrderScreen;
