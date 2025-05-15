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

// Map status constants to timestamp field names
const STATUS_TIMESTAMP_MAP = {
  [ORDER_STATUS.PENDING]: "orderPlacedAt",
  [ORDER_STATUS.PICKED_UP]: "pickedUpAt",
  [ORDER_STATUS.PROCESSING]: "processingAt",
  [ORDER_STATUS.DISPATCHED]: "outForDeliveryAt",
  [ORDER_STATUS.DELIVERED]: "deliveredAt",
  [ORDER_STATUS.CANCELLED]: "cancelledAt",
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
      timestamp: null,
    },
    {
      id: "pickedUp",
      label: ORDER_STATUS.PICKED_UP,
      icon: "cart",
      color: theme.colors.warning,
      timestamp: null,
    },
    {
      id: "processing",
      label: ORDER_STATUS.PROCESSING,
      icon: "construct",
      color: theme.colors.info,
      timestamp: null,
    },
    {
      id: "dispatched",
      label: ORDER_STATUS.DISPATCHED,
      icon: "bicycle",
      color: theme.colors.primary,
      timestamp: null,
    },
    {
      id: "delivered",
      label: ORDER_STATUS.DELIVERED,
      icon: "checkmark-done-circle",
      color: theme.colors.success,
      timestamp: null,
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

        // Log all order timestamps for debugging
        setTimeout(() => logOrderTimestamps(), 500);

        // Debug: Log all timestamp fields in the order data
        console.log("Order data timestamps:");
        Object.entries(STATUS_TIMESTAMP_MAP).forEach(([status, field]) => {
          console.log(`${status}: ${field} = ${data[field] || "missing"}`);
        });

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

  // Format timestamp specifically for the timeline
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Unknown time";

    try {
      const date = new Date(timestamp);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.log("Invalid date encountered:", timestamp);
        return "Invalid date";
      }

      const timeStr = date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      const dateStr = date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      });

      const relativeTime = getRelativeTime(timestamp);

      return `${timeStr}, ${dateStr} (${relativeTime})`;
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "Date error";
    }
  };

  // Add relative time to make it more user-friendly
  const getRelativeTime = (timestamp) => {
    try {
      const now = new Date();
      const date = new Date(timestamp);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "unknown time";
      }

      const diffTime = Math.abs(now - date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(
        (diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );

      if (diffDays > 0) {
        return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
      } else if (diffHours > 0) {
        return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
      } else {
        const diffMinutes = Math.floor(
          (diffTime % (1000 * 60 * 60)) / (1000 * 60)
        );
        return diffMinutes <= 1 ? "just now" : `${diffMinutes} mins ago`;
      }
    } catch (error) {
      console.error("Error calculating relative time:", error);
      return "unknown time";
    }
  };

  // Add function to update order status with proper timestamp
  const updateOrderStatus = async (newStatus) => {
    try {
      const orderDocRef = doc(db, "orders", orderId);

      // Get the appropriate timestamp field for this status
      const timestampField = STATUS_TIMESTAMP_MAP[newStatus];

      if (!timestampField) {
        console.error(`No timestamp field found for status: ${newStatus}`);
        return;
      }

      // Create an update object with the new status and timestamp
      const updateData = {
        status: newStatus,
        [timestampField]: new Date().toISOString(), // Set current timestamp for this specific step
      };

      console.log(
        `Updating order to ${newStatus} with timestamp field ${timestampField}`
      );
      await updateDoc(orderDocRef, updateData);

      // The snapshot listener will update the UI, but we also log here
      console.log(
        `Order status updated to: ${newStatus} with timestamp at ${updateData[timestampField]}`
      );

      // Wait a moment for the snapshot to update, then log all timestamps
      setTimeout(() => {
        if (orderData) {
          logOrderTimestamps();
        }
      }, 1000);
    } catch (error) {
      console.error("Error updating order status:", error);
      Alert.alert("Error", "Failed to update order status. Please try again.");
    }
  };

  // Add function to check which timestamp fields are populated
  const getPopulatedTimestampFields = () => {
    if (!orderData) return [];

    return Object.entries(STATUS_TIMESTAMP_MAP)
      .filter(([status, field]) => orderData[field])
      .map(([status, field]) => ({
        status,
        field,
        timestamp: orderData[field],
        formattedTime: formatTimestamp(orderData[field]),
      }));
  };

  // Add function to log timestamps for debugging
  const logOrderTimestamps = () => {
    console.log("\n=== ORDER TIMESTAMPS ===");
    console.log(`Order ID: ${orderId}`);
    console.log(`Current Status: ${orderData?.status || "unknown"}`);

    const fields = getPopulatedTimestampFields();
    if (fields.length === 0) {
      console.log("No timestamps found in order data");
    } else {
      fields.forEach((item) => {
        console.log(`${item.status}: ${item.formattedTime} [${item.field}]`);
      });
    }
    console.log("=======================\n");
  };

  const renderTimeline = () => {
    if (!orderData) return null;

    // If order is cancelled, create a different timeline
    if (orderData.status === ORDER_STATUS.CANCELLED) {
      const cancelledSteps = [
        {
          id: "ordered",
          label: ORDER_STATUS.PENDING,
          icon: "checkmark-circle-outline",
          color: theme.colors.secondary,
        },
        {
          id: "cancelled",
          label: ORDER_STATUS.CANCELLED,
          icon: "close-circle-outline",
          color: "#F56565",
        },
      ];

      return (
        <View style={styles.timelineContainer}>
          {cancelledSteps.map((step, index) => {
            const isCompleted = true; // All steps are completed in a cancelled order
            const isActive = index === 1; // The cancelled step is active
            const isLast = index === cancelledSteps.length - 1;

            // Get timestamp for this step
            let stepTimestamp = "";
            const timestampField = STATUS_TIMESTAMP_MAP[step.label];

            // Always show a timestamp for each step in cancelled orders
            if (orderData[timestampField]) {
              // Use the actual timestamp from the database
              stepTimestamp = formatTimestamp(orderData[timestampField]);
            } else if (index === 0 && orderData.createdAt) {
              // For the order placed step, use the creation time
              stepTimestamp = formatTimestamp(orderData.createdAt);
            } else if (
              index === 1 &&
              !orderData.cancelledAt &&
              orderData.createdAt
            ) {
              // If no specific cancelled timestamp, use "After" with creation time
              stepTimestamp = "After: " + formatTimestamp(orderData.createdAt);
            }

            return (
              <View key={step.id} style={styles.stepRow}>
                <View style={styles.stepIconContainer}>
                  <View
                    style={[
                      styles.stepIcon,
                      isActive && { backgroundColor: "#F56565" },
                      isCompleted && !isActive && styles.completedStepIcon,
                    ]}
                  >
                    <Ionicons
                      name={step.icon}
                      size={24}
                      color={isActive || isCompleted ? "#fff" : "#999"}
                    />
                  </View>
                  {!isLast && <View style={styles.lineContainer} />}
                </View>

                <View style={styles.stepTextContainer}>
                  <Text style={styles.stepLabel}>{step.label}</Text>

                  {/* Timestamp info */}
                  {stepTimestamp ? (
                    <Text style={styles.timestampText}>
                      {stepTimestamp}
                      {__DEV__ && (
                        <Text style={{ fontSize: 10, color: "#718096" }}>
                          {` (${STATUS_TIMESTAMP_MAP[step.label]})`}
                        </Text>
                      )}
                    </Text>
                  ) : (
                    __DEV__ && (
                      <Text
                        style={{
                          fontSize: 10,
                          color: "#718096",
                          fontStyle: "italic",
                        }}
                      >
                        No timestamp for {STATUS_TIMESTAMP_MAP[step.label]}
                      </Text>
                    )
                  )}

                  {isActive && (
                    <Text style={[styles.activeText, { color: "#F56565" }]}>
                      Order was cancelled
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      );
    }

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

          // Get timestamp for this step
          let stepTimestamp = "";
          const timestampField = STATUS_TIMESTAMP_MAP[step.label];

          if (orderData[timestampField]) {
            // Use the actual timestamp from the database
            stepTimestamp = formatTimestamp(orderData[timestampField]);
          } else if (index === 0 && orderData.createdAt) {
            // For the order placed step, use the creation time
            stepTimestamp = formatTimestamp(orderData.createdAt);
          } else if (isCompleted || isActive) {
            // For completed or active steps without timestamps
            stepTimestamp = isActive ? "In progress" : "Time not recorded";
          } else {
            // For future steps
            stepTimestamp = "Not started yet";
          }

          return (
            <View key={step.id} style={styles.stepRow}>
              <View style={styles.stepIconContainer}>
                <View
                  style={[
                    styles.stepIcon,
                    isActive && styles.activeStepIcon,
                    isCompleted && styles.completedStepIcon,
                  ]}
                >
                  <Ionicons
                    name={step.icon}
                    size={24}
                    color={isActive || isCompleted ? "#fff" : "#999"}
                  />
                </View>
                {!isLast && <View style={styles.lineContainer} />}
              </View>

              <View style={styles.stepTextContainer}>
                <Text style={styles.stepLabel}>{step.label}</Text>

                {/* Timestamp info */}
                {stepTimestamp ? (
                  <Text style={styles.timestampText}>
                    {stepTimestamp}
                    {__DEV__ && (
                      <Text style={{ fontSize: 10, color: "#718096" }}>
                        {` (${STATUS_TIMESTAMP_MAP[step.label]})`}
                      </Text>
                    )}
                  </Text>
                ) : (
                  __DEV__ && (
                    <Text
                      style={{
                        fontSize: 10,
                        color: "#718096",
                        fontStyle: "italic",
                      }}
                    >
                      No timestamp for {STATUS_TIMESTAMP_MAP[step.label]}
                    </Text>
                  )
                )}

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
            // Use the updateOrderStatus function to update status and set timestamp
            await updateOrderStatus(ORDER_STATUS.CANCELLED);
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

  const handleChatWithProvider = () => {
    navigation.navigate("Chat", {
      orderId,
      serviceProviderId: orderData.serviceProviderId,
      serviceProviderName: providerData?.name || "Service Provider",
      customerId: orderData.customerId,
      customerName: orderData.customerName || "Customer",
    });
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

        <TouchableOpacity
          style={[styles.chatButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleChatWithProvider}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
          <Text style={styles.chatButtonText}>Chat with Service Provider</Text>
        </TouchableOpacity>
      </Card>
    );
  };

  // Render a debug control panel for testing status updates (only in dev mode)
  const renderDebugPanel = () => {
    if (!__DEV__ || !orderData) return null;

    return (
      <View
        style={{
          marginTop: 20,
          padding: 10,
          backgroundColor: "#f0f0f0",
          borderRadius: 8,
        }}
      >
        <Text style={{ fontWeight: "bold", marginBottom: 10 }}>
          🛠️ DEV: Update Order Status
        </Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          {Object.values(ORDER_STATUS).map((status) => (
            <TouchableOpacity
              key={status}
              style={{
                backgroundColor:
                  orderData.status === status ? "#4299E1" : "#ddd",
                padding: 8,
                borderRadius: 4,
                margin: 4,
                width: "48%",
                alignItems: "center",
              }}
              onPress={() => updateOrderStatus(status)}
            >
              <Text
                style={{
                  color: orderData.status === status ? "white" : "black",
                }}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
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
        rightIcon="chatbubble-outline"
        onRightPress={handleChatWithProvider}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusContainer}>
          <Text style={styles.orderStatus}>{orderData.status}</Text>
        </View>

        {renderTimeline()}

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
          <Text style={[styles.totalAmount, { color: theme.colors.primary }]}>
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

        {/* Developer test panel */}
        {renderDebugPanel()}
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
    marginBottom: 36,
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
  completedStepIcon: {
    backgroundColor: "#48BB78",
  },
  lineContainer: {
    width: 2,
    height: 44,
    backgroundColor: "#E2E8F0",
    marginTop: 8,
    marginLeft: 19,
  },
  stepTextContainer: {
    flex: 1,
    justifyContent: "center",
    minHeight: 70,
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2D3748",
    marginBottom: 4,
  },
  timestampText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4A5568",
    marginBottom: 4,
    marginTop: 2,
    backgroundColor: "#F7FAFC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
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
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CD964",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  chatButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default TrackOrderScreen;
