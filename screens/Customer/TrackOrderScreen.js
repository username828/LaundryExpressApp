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
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { db } from "../../firebaseConfig";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import * as Notifications from "expo-notifications";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../theme/ThemeContext";

// Import custom components
import Header from "../../components/Header";
import Card from "../../components/Card";
import Button from "../../components/Button";

const { width } = Dimensions.get("window");

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
  const theme = useTheme();
  const navigation = useNavigation();
  const { orderId, providerId } = route.params;

  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(null);
  const [providerData, setProviderData] = useState(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const allSteps = [
    {
      id: "ordered",
      label: ORDER_STATUS.PENDING,
      icon: "checkmark-circle-outline",
      color: theme.colors.secondary,
    },
    {
      id: "pickedUp",
      label: ORDER_STATUS.PICKED_UP,
      icon: "cart",
      color: theme.colors.warning,
    },
    {
      id: "processing",
      label: ORDER_STATUS.PROCESSING,
      icon: "construct",
      color: theme.colors.info,
    },
    {
      id: "dispatched",
      label: ORDER_STATUS.DISPATCHED,
      icon: "bicycle",
      color: theme.colors.primary,
    },
    {
      id: "delivered",
      label: ORDER_STATUS.DELIVERED,
      icon: "checkmark-done-circle",
      color: theme.colors.success,
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
    const orderRef = doc(db, "orders", orderId);
    const unsubscribe = onSnapshot(orderRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setOrderData(data);

        // Find the current step index - add safety check
        console.log("Current status from DB:", data.status);
        console.log(
          "Available steps:",
          allSteps.map((step) => step.label).join(", ")
        );

        if (allSteps && Array.isArray(allSteps)) {
          const currentIndex = allSteps.findIndex(
            (step) => step.label === data.status
          );
          setCurrentStep(data.status);

          // Start animations
          if (currentIndex >= 0) {
            startPulseAnimation();
            animateProgressLine(currentIndex);
          } else {
            console.log("Step not found in allSteps array");
          }
        } else {
          console.error("allSteps is not properly defined");
        }

        // Fetch service provider data
        if (data.serviceProviderId) {
          const providerRef = doc(
            db,
            "serviceProviders",
            data.serviceProviderId
          );
          onSnapshot(providerRef, (providerDoc) => {
            if (providerDoc.exists()) {
              setProviderData(providerDoc.data());
            }
          });
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
        return { color: theme.colors.secondary };
      case ORDER_STATUS.PICKED_UP:
        return { color: theme.colors.warning };
      case ORDER_STATUS.PROCESSING:
        return { color: theme.colors.info };
      case ORDER_STATUS.DISPATCHED:
        return { color: theme.colors.primary };
      case ORDER_STATUS.DELIVERED:
        return { color: theme.colors.success };
      case ORDER_STATUS.CANCELLED:
        return { color: theme.colors.error };
      default:
        return { color: theme.colors.textLight };
    }
  };

  // Format date helper function
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
          const isLast = index === allSteps.length - 1;

          return (
            <View key={step.id} style={styles.stepRow}>
              <View style={styles.stepIconContainer}>
                <View
                  style={[styles.stepIcon, isActive && styles.activeStepIcon]}
                >
                  <Ionicons
                    name={step.icon}
                    size={24}
                    color={isActive ? "#fff" : "#999"}
                  />
                </View>
                {!isLast && <View style={styles.lineContainer} />}
              </View>

              <View style={styles.stepTextContainer}>
                <Text style={styles.stepLabel}>{step.label}</Text>
                {isActive && (
                  <Text style={styles.activeText}>Currently in progress</Text>
                )}
                {isNext && <Text style={styles.nextText}>Next step</Text>}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const handleCancelOrder = () => {
    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      {
        text: "No",
        style: "cancel",
      },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          try {
            const orderDocRef = doc(db, "orders", orderId);
            await updateDoc(orderDocRef, {
              status: ORDER_STATUS.CANCELLED,
            });
            Alert.alert(
              "Order Cancelled",
              "Your order has been cancelled successfully."
            );
          } catch (error) {
            console.error("Error cancelling order:", error);
            Alert.alert(
              "Error",
              "Failed to cancel order. Please try again later."
            );
          }
        },
      },
    ]);
  };

  const renderOrderDetails = () => {
    if (!orderData) return null;

    const hasMultipleServices =
      orderData.services && orderData.services.length > 0;

    return (
      <Card style={styles.detailsCard}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Order Details
        </Text>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.textLight }]}>
            Order ID
          </Text>
          <Text style={[styles.detailValue, { color: theme.colors.text }]}>
            #{orderData.orderId.substring(0, 8)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.textLight }]}>
            Date
          </Text>
          <Text style={[styles.detailValue, { color: theme.colors.text }]}>
            {formatDate(orderData.createdAt)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.textLight }]}>
            Address
          </Text>
          <Text style={[styles.detailValue, { color: theme.colors.text }]}>
            {orderData.address}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.textLight }]}>
            Status
          </Text>
          <Text style={[styles.detailValue, getStatusStyle(orderData.status)]}>
            {orderData.status}
          </Text>
        </View>

        <View style={styles.divider} />

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Services
        </Text>

        {hasMultipleServices ? (
          orderData.services.map((service, index) => (
            <View key={index} style={styles.serviceItem}>
              <View style={styles.serviceRow}>
                <Text
                  style={[styles.serviceName, { color: theme.colors.text }]}
                >
                  {service.serviceType}
                </Text>
                <Text
                  style={[
                    styles.servicePrice,
                    { color: theme.colors.textLight },
                  ]}
                >
                  ${service.price.toFixed(2)} each
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.serviceItem}>
            <View style={styles.serviceRow}>
              <Text style={[styles.serviceName, { color: theme.colors.text }]}>
                {orderData.serviceType}
              </Text>
              <Text
                style={[styles.servicePrice, { color: theme.colors.textLight }]}
              >
                ${orderData.price ? orderData.price.toFixed(2) : "0.00"} each
              </Text>
            </View>
          </View>
        )}

        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: theme.colors.text }]}>
            Total
          </Text>
          <Text style={[styles.totalAmount, { color: theme.colors.primary }]}>
            $
            {hasMultipleServices
              ? orderData.totalPrice.toFixed(2)
              : orderData.price.toFixed(2)}
          </Text>
        </View>

        <View style={styles.divider} />

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Time Schedule
        </Text>

        <View style={styles.scheduleRow}>
          <View style={styles.scheduleItem}>
            <Ionicons
              name="calendar-outline"
              size={24}
              color="#4299E1"
              style={styles.scheduleIcon}
            />
            <Text style={styles.scheduleTime}>
              {orderData.orderPickup?.date}
            </Text>
            <Text style={styles.scheduleTime}>
              {orderData.orderPickup?.time}
            </Text>
          </View>

          <View style={styles.scheduleDivider} />

          <View style={styles.scheduleItem}>
            <Ionicons
              name="calendar-outline"
              size={24}
              color="#48BB78"
              style={styles.scheduleIcon}
            />
            <Text style={styles.scheduleTime}>
              {orderData.orderDropoff?.date}
            </Text>
            <Text style={styles.scheduleTime}>
              {orderData.orderDropoff?.time}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  const renderServiceProvider = () => {
    if (!providerData) return null;

    return (
      <Card style={styles.providerCard}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Service Provider
        </Text>

        <View style={styles.providerInfo}>
          <View
            style={[
              styles.providerAvatar,
              { backgroundColor: theme.colors.primaryLight },
            ]}
          >
            <Text
              style={[styles.providerInitial, { color: theme.colors.primary }]}
            >
              {providerData.name?.charAt(0).toUpperCase() || "S"}
            </Text>
          </View>
          <View style={styles.providerDetails}>
            <Text style={[styles.providerName, { color: theme.colors.text }]}>
              {providerData.name || "Service Provider"}
            </Text>
            <Text
              style={[
                styles.providerContact,
                { color: theme.colors.textLight },
              ]}
            >
              {providerData.phone || "No contact info available"}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Header
          title="Track Order"
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

  if (!orderData) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Header
          title="Track Order"
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
          <Text
            style={[styles.errorSubtext, { color: theme.colors.textLight }]}
          >
            We couldn't find details for this order.
          </Text>
          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
            style={styles.goBackButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const canCancel = orderData.status === ORDER_STATUS.PENDING;

  // Calculate currentStepIndex from currentStep
  const currentStepIndex = allSteps.findIndex(
    (step) => step.label === currentStep
  );

  // Determine if order has multiple services
  const hasMultipleServices =
    orderData.services && orderData.services.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <Header
        title="Track Order"
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusContainer}>
          <Text style={styles.orderStatus}>{orderData.status}</Text>
        </View>

        <View style={styles.timelineContainer}>
          {allSteps.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isActive = index === currentStepIndex;
            const isNext = index === currentStepIndex + 1;
            const isLast = index === allSteps.length - 1;

            return (
              <View key={step.id} style={styles.stepRow}>
                <View style={styles.stepIconContainer}>
                  <View
                    style={[styles.stepIcon, isActive && styles.activeStepIcon]}
                  >
                    <Ionicons
                      name={step.icon}
                      size={24}
                      color={isActive ? "#fff" : "#999"}
                    />
                  </View>
                  {!isLast && <View style={styles.lineContainer} />}
                </View>

                <View style={styles.stepTextContainer}>
                  <Text style={styles.stepLabel}>{step.label}</Text>
                  {isActive && (
                    <Text style={styles.activeText}>Currently in progress</Text>
                  )}
                  {isNext && <Text style={styles.nextText}>Next step</Text>}
                </View>
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Order Details</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Order ID</Text>
          <Text style={styles.detailValue}>
            #{orderData.orderId.substring(0, 8)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date</Text>
          <Text style={styles.detailValue}>
            {formatDate(orderData.createdAt)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Address</Text>
          <Text style={styles.detailValue}>{orderData.address}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Services</Text>

        {hasMultipleServices ? (
          orderData.services.map((service, index) => (
            <View key={index} style={styles.serviceItem}>
              <View style={styles.serviceRow}>
                <Text style={styles.serviceName}>{service.serviceType}</Text>
                <Text style={styles.servicePrice}>
                  ${service.price.toFixed(2)} each
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.serviceItem}>
            <View style={styles.serviceRow}>
              <Text style={styles.serviceName}>{orderData.serviceType}</Text>
              <Text style={styles.servicePrice}>
                ${orderData.price ? orderData.price.toFixed(2) : "0.00"} each
              </Text>
            </View>
          </View>
        )}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>
            $
            {hasMultipleServices
              ? orderData.totalPrice.toFixed(2)
              : orderData.price.toFixed(2)}
          </Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Time Schedule</Text>

        <View style={styles.scheduleRow}>
          <View style={styles.scheduleItem}>
            <Ionicons
              name="calendar-outline"
              size={24}
              color="#4299E1"
              style={styles.scheduleIcon}
            />
            <Text style={styles.scheduleTime}>
              {orderData.orderPickup?.date}
            </Text>
            <Text style={styles.scheduleTime}>
              {orderData.orderPickup?.time}
            </Text>
          </View>

          <View style={styles.scheduleDivider} />

          <View style={styles.scheduleItem}>
            <Ionicons
              name="calendar-outline"
              size={24}
              color="#48BB78"
              style={styles.scheduleIcon}
            />
            <Text style={styles.scheduleTime}>
              {orderData.orderDropoff?.date}
            </Text>
            <Text style={styles.scheduleTime}>
              {orderData.orderDropoff?.time}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Service Provider</Text>

        <View style={styles.providerInfo}>
          <View style={styles.providerAvatar}>
            <Text style={styles.providerInitial}>
              {providerData?.name?.charAt(0).toUpperCase() || "S"}
            </Text>
          </View>
          <Text style={styles.providerName}>
            {providerData?.name || "Service Provider"}
          </Text>
        </View>

        {canCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelOrder}
          >
            <Ionicons name="close-circle-outline" size={24} color="#fff" />
            <Text style={styles.cancelButtonText}>Cancel Order</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 16,
    marginTop: 8,
    textAlign: "center",
  },
  goBackButton: {
    marginTop: 24,
    minWidth: 150,
  },
  statusContainer: {
    marginBottom: 24,
    alignItems: "center",
  },
  orderStatus: {
    fontSize: 24,
    fontWeight: "600",
    color: "#2D3748",
    textTransform: "uppercase",
  },
  timelineContainer: {
    marginBottom: 32,
  },
  stepRow: {
    flexDirection: "row",
    marginBottom: 24,
  },
  stepIconContainer: {
    alignItems: "center",
    marginRight: 16,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  activeStepIcon: {
    backgroundColor: "#4299E1",
  },
  lineContainer: {
    width: 2,
    height: 32,
    backgroundColor: "#E2E8F0",
    marginTop: 8,
    marginLeft: 19, // Center the line with the icon
  },
  stepTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2D3748",
    marginBottom: 4,
  },
  activeText: {
    fontSize: 14,
    color: "#4299E1",
    fontWeight: "500",
  },
  nextText: {
    fontSize: 14,
    color: "#718096",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2D3748",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: "#718096",
  },
  detailValue: {
    fontSize: 14,
    color: "#2D3748",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 24,
  },
  serviceItem: {
    backgroundColor: "#F7FAFC",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serviceName: {
    fontSize: 16,
    color: "#2D3748",
    fontWeight: "500",
  },
  servicePrice: {
    fontSize: 14,
    color: "#718096",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3748",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4299E1",
  },
  scheduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F7FAFC",
    borderRadius: 12,
    padding: 16,
  },
  scheduleItem: {
    flex: 1,
    alignItems: "center",
  },
  scheduleIcon: {
    marginBottom: 8,
  },
  scheduleTime: {
    fontSize: 14,
    color: "#2D3748",
    textAlign: "center",
    marginBottom: 4,
  },
  scheduleDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "#E2E8F0",
    marginHorizontal: 16,
  },
  providerInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7FAFC",
    borderRadius: 12,
    padding: 16,
  },
  providerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4299E1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  providerInitial: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  providerDetails: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2D3748",
  },
  providerContact: {
    fontSize: 14,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F56565",
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 8,
  },
  detailsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  providerCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
});

export default TrackOrderScreen;
