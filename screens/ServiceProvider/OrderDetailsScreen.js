import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { firestore as db } from "../../firebaseConfig";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  Clock,
  Package,
  CheckCircle,
  Truck,
  ShoppingBag,
  Loader,
  ArrowLeft,
} from "lucide-react-native";

// Order status constants
const ORDER_STATUS = {
  PENDING: "pending",
  RECEIVED: "Order Placed",
  PICKED_UP: "Picked Up",
  PROCESSING: "Washing",
  IRONING: "Ironing",
  DISPATCHED: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "cancelled",
};

const OrderDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { orderId } = route.params;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const orderRef = doc(db, "orders", orderId);
      const orderSnap = await getDoc(orderRef);

      if (orderSnap.exists()) {
        setOrder({ id: orderSnap.id, ...orderSnap.data() });
      } else {
        Alert.alert("Error", "Order not found");
        navigation.goBack();
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      Alert.alert("Error", "Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus) => {
    try {
      setUpdating(true);
      const orderRef = doc(db, "orders", orderId);

      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });

      // Update local state
      setOrder({ ...order, status: newStatus });

      Alert.alert("Success", `Order status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating order status:", error);
      Alert.alert("Error", "Failed to update order status");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        return <Clock color="#FFA500" size={24} />;
      case ORDER_STATUS.RECEIVED:
        return <ShoppingBag color="#34C759" size={24} />;
      case ORDER_STATUS.PICKED_UP:
        return <Package color="#FF9500" size={24} />;
      case ORDER_STATUS.PROCESSING:
        return <Loader color="#5AC8FA" size={24} />;
      case ORDER_STATUS.IRONING:
        return <Ionicons name="shirt-outline" size={24} color="#FF3B30" />;
      case ORDER_STATUS.DISPATCHED:
        return <Truck color="#007AFF" size={24} />;
      case ORDER_STATUS.DELIVERED:
        return <CheckCircle color="#4CD964" size={24} />;
      case ORDER_STATUS.CANCELLED:
        return <Ionicons name="close-circle" size={24} color="#DC3545" />;
      default:
        return <Clock color="#6C757D" size={24} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        return "#FFA500";
      case ORDER_STATUS.RECEIVED:
        return "#34C759";
      case ORDER_STATUS.PICKED_UP:
        return "#FF9500";
      case ORDER_STATUS.PROCESSING:
        return "#5AC8FA";
      case ORDER_STATUS.IRONING:
        return "#FF3B30";
      case ORDER_STATUS.DISPATCHED:
        return "#007AFF";
      case ORDER_STATUS.DELIVERED:
        return "#4CD964";
      case ORDER_STATUS.CANCELLED:
        return "#DC3545";
      default:
        return "#6C757D";
    }
  };

  const renderNextStepButton = () => {
    if (!order) return null;

    let nextStatus = null;
    let buttonText = "";
    let buttonColor = "";

    switch (order.status) {
      case ORDER_STATUS.PENDING:
        nextStatus = ORDER_STATUS.RECEIVED;
        buttonText = "Confirm Order Received";
        buttonColor = "#34C759";
        break;
      case ORDER_STATUS.RECEIVED:
        nextStatus = ORDER_STATUS.PICKED_UP;
        buttonText = "Mark as Picked Up";
        buttonColor = "#FF9500";
        break;
      case ORDER_STATUS.PICKED_UP:
        nextStatus = ORDER_STATUS.PROCESSING;
        buttonText = "Start Washing";
        buttonColor = "#5AC8FA";
        break;
      case ORDER_STATUS.PROCESSING:
        nextStatus = ORDER_STATUS.IRONING;
        buttonText = "Start Ironing";
        buttonColor = "#FF3B30";
        break;
      case ORDER_STATUS.IRONING:
        nextStatus = ORDER_STATUS.DISPATCHED;
        buttonText = "Dispatch for Delivery";
        buttonColor = "#007AFF";
        break;
      case ORDER_STATUS.DISPATCHED:
        nextStatus = ORDER_STATUS.DELIVERED;
        buttonText = "Mark as Delivered";
        buttonColor = "#4CD964";
        break;
      case ORDER_STATUS.DELIVERED:
      case ORDER_STATUS.CANCELLED:
        return null; // No next step for delivered or cancelled orders
      default:
        return null;
    }

    return (
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: buttonColor }]}
        onPress={() => updateOrderStatus(nextStatus)}
        disabled={updating}
      >
        {updating ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            {getStatusIcon(nextStatus)}
            <Text style={styles.actionButtonText}>{buttonText}</Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  const renderStatusTimeline = () => {
    const statuses = [
      ORDER_STATUS.RECEIVED,
      ORDER_STATUS.PICKED_UP,
      ORDER_STATUS.PROCESSING,
      ORDER_STATUS.IRONING,
      ORDER_STATUS.DISPATCHED,
      ORDER_STATUS.DELIVERED,
    ];

    const currentStatusIndex = statuses.findIndex(
      (status) => status === order?.status
    );

    return (
      <View style={styles.timelineContainer}>
        {statuses.map((status, index) => {
          const isCompleted = currentStatusIndex >= index;
          const isActive = currentStatusIndex === index;

          return (
            <View key={status} style={styles.timelineItem}>
              <View style={styles.timelineIconContainer}>
                <View
                  style={[
                    styles.timelineIcon,
                    isCompleted
                      ? { backgroundColor: getStatusColor(status) }
                      : styles.incompleteIcon,
                    isActive && styles.activeIcon,
                  ]}
                >
                  {getStatusIcon(status)}
                </View>
                {index < statuses.length - 1 && (
                  <View
                    style={[
                      styles.timelineLine,
                      index < currentStatusIndex && {
                        backgroundColor: getStatusColor(statuses[index]),
                      },
                    ]}
                  />
                )}
              </View>
              <View style={styles.timelineTextContainer}>
                <Text
                  style={[
                    styles.timelineText,
                    isCompleted && {
                      color: getStatusColor(status),
                      fontWeight: "600",
                    },
                  ]}
                >
                  {status}
                </Text>
                {isCompleted && order?.updatedAt && (
                  <Text style={styles.timelineTime}>
                    {new Date(order.updatedAt).toLocaleTimeString([], {
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
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={[styles.header, { paddingTop: insets.top > 0 ? 0 : 20 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft color="#007AFF" size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Order Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={[styles.header, { paddingTop: insets.top > 0 ? 0 : 20 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft color="#007AFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Order Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        <View style={styles.orderInfoCard}>
          <Text style={styles.orderId}>
            Order #{order?.orderId || order?.id.substring(0, 8)}
          </Text>
          <View
            style={styles.statusBadge}
            backgroundColor={getStatusColor(order?.status)}
          >
            <View style={styles.statusIconContainer}>
              {getStatusIcon(order?.status)}
              <Text style={styles.statusText}>
                {order?.status?.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name:</Text>
            <Text style={styles.detailValue}>
              {order?.customerName || "N/A"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone:</Text>
            <Text style={styles.detailValue}>
              {order?.customerPhone || "N/A"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailValue}>
              {order?.customerEmail || "N/A"}
            </Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Order Information</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service:</Text>
            <Text style={styles.detailValue}>
              {order?.serviceType || "N/A"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Price:</Text>
            <Text style={styles.detailValue}>
              ${order?.price?.toFixed(2) || "0.00"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>
              {order?.createdAt
                ? new Date(order.createdAt).toLocaleDateString()
                : "N/A"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time:</Text>
            <Text style={styles.detailValue}>
              {order?.selectedTime || "N/A"}
            </Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <Text style={styles.addressText}>
            {order?.address || "No address provided"}
          </Text>
        </View>

        {order?.notes && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Customer Notes</Text>
            <Text style={styles.notesText}>{order.notes}</Text>
          </View>
        )}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Order Progress</Text>
          {renderStatusTimeline()}
        </View>

        <View style={styles.actionContainer}>
          {renderNextStepButton()}

          {order?.status !== ORDER_STATUS.CANCELLED &&
            order?.status !== ORDER_STATUS.DELIVERED && (
              <TouchableOpacity
                style={[styles.cancelButton, updating && styles.disabledButton]}
                onPress={() => {
                  Alert.alert(
                    "Cancel Order",
                    "Are you sure you want to cancel this order?",
                    [
                      { text: "No", style: "cancel" },
                      {
                        text: "Yes",
                        style: "destructive",
                        onPress: () =>
                          updateOrderStatus(ORDER_STATUS.CANCELLED),
                      },
                    ]
                  );
                }}
                disabled={updating}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={24}
                  color="#FFFFFF"
                />
                <Text style={styles.cancelButtonText}>Cancel Order</Text>
              </TouchableOpacity>
            )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
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
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  placeholder: {
    width: 40,
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
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 40,
  },
  orderInfoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderId: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusIconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 12,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: "#8E8E93",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "500",
    flex: 2,
    textAlign: "right",
  },
  addressText: {
    fontSize: 14,
    color: "#000000",
    lineHeight: 20,
  },
  notesText: {
    fontSize: 14,
    color: "#000000",
    lineHeight: 20,
    fontStyle: "italic",
  },
  timelineContainer: {
    marginTop: 8,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timelineIconContainer: {
    alignItems: "center",
    width: 40,
  },
  timelineIcon: {
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
  activeIcon: {
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  timelineLine: {
    width: 2,
    height: 40,
    backgroundColor: "#E5E5EA",
  },
  timelineTextContainer: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  timelineText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#3C3C43",
    marginBottom: 4,
  },
  timelineTime: {
    fontSize: 13,
    color: "#8E8E93",
  },
  actionContainer: {
    marginTop: 8,
  },
  actionButton: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: "#DC3545",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#DC3545",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default OrderDetailsScreen;