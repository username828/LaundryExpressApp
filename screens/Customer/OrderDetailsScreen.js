import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useTheme } from "../../theme/ThemeContext";
import Header from "../../components/Header";
import Button from "../../components/Button";
import { Ionicons } from "@expo/vector-icons";

const ORDER_STATUS = {
  PENDING: "Order Placed",
  PICKED_UP: "Picked Up",
  PROCESSING: "Order Processing",
  DISPATCHED: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const OrderDetailsScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    const orderRef = doc(db, "orders", orderId);
    const unsubscribe = onSnapshot(orderRef, (doc) => {
      if (doc.exists()) {
        setOrder({ id: doc.id, ...doc.data() });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [orderId]);

  const getStatusColor = (status) => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        return "#4CAF50"; // Green
      case ORDER_STATUS.PICKED_UP:
        return "#FF9800"; // Orange
      case ORDER_STATUS.PROCESSING:
        return "#2196F3"; // Blue
      case ORDER_STATUS.DISPATCHED:
        return "#3F51B5"; // Indigo
      case ORDER_STATUS.DELIVERED:
        return "#4CD964"; // Green
      case ORDER_STATUS.CANCELLED:
        return "#F44336"; // Red
      default:
        return "#9E9E9E"; // Gray
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        return "checkmark-circle-outline";
      case ORDER_STATUS.PICKED_UP:
        return "bag-handle-outline";
      case ORDER_STATUS.PROCESSING:
        return "refresh-circle-outline";
      case ORDER_STATUS.DISPATCHED:
        return "car-outline";
      case ORDER_STATUS.DELIVERED:
        return "cube-outline";
      default:
        return "ellipse-outline";
    }
  };

  const renderTimeline = () => {
    if (!order) return null;

    const statuses = [
      ORDER_STATUS.PENDING,
      ORDER_STATUS.PICKED_UP,
      ORDER_STATUS.PROCESSING,
      ORDER_STATUS.DISPATCHED,
      ORDER_STATUS.DELIVERED,
    ];

    // Find the current status index
    const currentIndex = statuses.findIndex(
      (status) => status === order.status
    );

    // If order is cancelled, show special timeline
    if (order.status === ORDER_STATUS.CANCELLED) {
      return (
        <View style={styles.timelineContainer}>
          <Text style={styles.sectionTitle}>Order Status</Text>
          <View style={styles.cancelledContainer}>
            <Ionicons name="close-circle" size={48} color="#F44336" />
            <Text style={styles.cancelledText}>This order was cancelled</Text>
            <Text style={styles.cancelledSubtext}>
              {order.cancellationReason || "No reason provided"}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.timelineContainer}>
        <Text style={styles.sectionTitle}>Order Status</Text>
        {statuses.map((status, index) => {
          const isCompleted = index <= currentIndex;
          const isLast = index === statuses.length - 1;

          return (
            <View key={status} style={styles.timelineStep}>
              <View style={styles.timelineIconSection}>
                <View
                  style={[
                    styles.timelineIcon,
                    {
                      backgroundColor: isCompleted
                        ? getStatusColor(status)
                        : "#E0E0E0",
                    },
                  ]}
                >
                  <Ionicons
                    name={getStatusIcon(status)}
                    size={16}
                    color="#FFFFFF"
                  />
                </View>
                {!isLast && (
                  <View
                    style={[
                      styles.timelineLine,
                      {
                        backgroundColor: isCompleted
                          ? getStatusColor(status)
                          : "#E0E0E0",
                      },
                    ]}
                  />
                )}
              </View>
              <View style={styles.timelineTextContainer}>
                <Text
                  style={[
                    styles.timelineText,
                    {
                      color: isCompleted ? getStatusColor(status) : "#9E9E9E",
                      fontWeight: isCompleted ? "600" : "400",
                    },
                  ]}
                >
                  {status}
                </Text>
                {order.timestamps && order.timestamps[status] && (
                  <Text style={styles.timelineDate}>
                    {new Date(order.timestamps[status]).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Order Details" showBack />
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
        <Header title="Order Details" showBack />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Order not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Order Details" showBack />
      <ScrollView style={styles.scrollView}>
        {/* Order ID and Status */}
        <View style={styles.section}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderId}>
              Order #{order.orderId ? order.orderId : order.id.substring(0, 8)}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(order.status) },
              ]}
            >
              <Text style={styles.statusText}>{order.status}</Text>
            </View>
          </View>

          <View style={styles.orderDate}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color="#666666"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.orderDateText}>
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

        {/* Timeline */}
        {renderTimeline()}

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          {order.services?.map((service, index) => (
            <View key={index} style={styles.serviceItem}>
              <View style={styles.serviceRow}>
                <Text style={styles.serviceName}>{service.serviceType}</Text>
                <Text style={styles.serviceQty}>x{service.quantity}</Text>
              </View>
              <Text style={styles.servicePrice}>
                ${parseFloat(service.price).toFixed(2)} each
              </Text>
            </View>
          ))}
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>
              $
              {order.totalPrice
                ? parseFloat(order.totalPrice).toFixed(2)
                : "0.00"}
            </Text>
          </View>
        </View>

        {/* Schedule */}
        {(order.orderPickup || order.orderDropoff) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Schedule</Text>
            <View style={styles.scheduleContainer}>
              {order.orderPickup && (
                <View style={styles.scheduleItem}>
                  <Text style={styles.scheduleLabel}>Pickup</Text>
                  <View style={styles.scheduleDateRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color="#666666"
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.scheduleValue}>
                      {order.orderPickup.date}
                    </Text>
                  </View>
                  <View style={styles.scheduleTimeRow}>
                    <Ionicons
                      name="time-outline"
                      size={14}
                      color="#666666"
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.scheduleValue}>
                      {order.orderPickup.time}
                    </Text>
                  </View>
                </View>
              )}
              {order.orderDropoff && (
                <View style={styles.scheduleItem}>
                  <Text style={styles.scheduleLabel}>Dropoff</Text>
                  <View style={styles.scheduleDateRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color="#666666"
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.scheduleValue}>
                      {order.orderDropoff.date}
                    </Text>
                  </View>
                  <View style={styles.scheduleTimeRow}>
                    <Ionicons
                      name="time-outline"
                      size={14}
                      color="#666666"
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.scheduleValue}>
                      {order.orderDropoff.time}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Delivery Address if exists */}
        {order.address && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <View style={styles.addressContainer}>
              <Ionicons
                name="location-outline"
                size={16}
                color="#666666"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.addressText}>{order.address}</Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {order.status === ORDER_STATUS.DELIVERED && !order.reviewed && (
            <Button
              title="Leave Review"
              icon="star"
              onPress={() =>
                navigation.navigate("ReviewOrder", {
                  orderId: order.id,
                  providerId: order.serviceProviderId,
                })
              }
            />
          )}
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
  },
  errorText: {
    fontSize: 16,
    color: "#666666",
  },
  section: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
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
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderId: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  orderDate: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderDateText: {
    fontSize: 14,
    color: "#666666",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 12,
  },
  timelineContainer: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
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
  timelineStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  timelineIconSection: {
    alignItems: "center",
    width: 30,
  },
  timelineIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  timelineLine: {
    width: 2,
    height: 30,
    marginLeft: 14,
  },
  timelineTextContainer: {
    flex: 1,
    paddingLeft: 16,
    justifyContent: "center",
  },
  timelineText: {
    fontSize: 14,
  },
  timelineDate: {
    fontSize: 12,
    color: "#9E9E9E",
    marginTop: 2,
  },
  cancelledContainer: {
    alignItems: "center",
    padding: 16,
  },
  cancelledText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F44336",
    marginTop: 12,
  },
  cancelledSubtext: {
    fontSize: 14,
    color: "#9E9E9E",
    marginTop: 4,
    textAlign: "center",
  },
  serviceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9F9FB",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  serviceName: {
    fontSize: 14,
    color: "#333333",
    fontWeight: "500",
    marginRight: 8,
  },
  serviceQty: {
    fontSize: 14,
    color: "#666666",
  },
  servicePrice: {
    fontSize: 14,
    color: "#333333",
    fontWeight: "500",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333333",
  },
  totalValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333333",
  },
  scheduleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F9F9FB",
    borderRadius: 8,
    padding: 12,
  },
  scheduleItem: {
    alignItems: "flex-start",
    flex: 1,
  },
  scheduleLabel: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
    marginBottom: 8,
  },
  scheduleDateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  scheduleTimeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  scheduleValue: {
    fontSize: 14,
    color: "#333333",
  },
  addressContainer: {
    flexDirection: "row",
    backgroundColor: "#F9F9FB",
    borderRadius: 8,
    padding: 12,
    alignItems: "flex-start",
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: "#333333",
    lineHeight: 20,
  },
  actionsContainer: {
    padding: 16,
    paddingBottom: 32,
  },
});

export default OrderDetailsScreen;
