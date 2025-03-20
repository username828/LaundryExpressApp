import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from "react-native";
import { firestore as db } from "../../firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import {
  Clock,
  Package,
  Check,
  Truck,
  ShoppingBag,
  Loader,
  ChevronDown,
  ChevronUp,
  MessageCircle,
} from "lucide-react-native";
import { auth } from "../../firebaseConfig";
import {
  SafeAreaView,
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

// Order status constants
const ORDER_STATUS = {
  PENDING: "Order Placed",
  PICKED_UP: "Picked Up",
  PROCESSING: "Order Processing",
  DISPATCHED: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const fetchOrders = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        Alert.alert("Error", "User not logged in.");
        setLoading(false);
        return;
      }

      const serviceProviderId = user.uid;
      const ordersQuery = query(
        collection(db, "orders"),
        where("serviceProviderId", "==", serviceProviderId)
      );

      const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
        const ordersData = snapshot.docs
          .map((docSnapshot) => ({
            id: docSnapshot.id,
            ...docSnapshot.data(),
          }))
          .sort(
            (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
          );

        setOrders(ordersData);
        setLoading(false);
      });

      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.error("Error fetching orders: ", error);
      Alert.alert("Error", "Could not fetch orders. Please try again later.", [
        { text: "OK" },
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const toggleOrderExpand = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });

      // Update local state
      setOrders(
        orders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      Alert.alert("Success", `Order marked as "${newStatus}" successfully`, [
        { text: "OK" },
      ]);
    } catch (error) {
      console.error("Error updating order: ", error);
      Alert.alert("Error", "Could not update order status. Please try again.", [
        { text: "OK" },
      ]);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        return "#FFA500"; // Orange
      case ORDER_STATUS.PICKED_UP:
        return "#FF9500"; // Dark Orange
      case ORDER_STATUS.PROCESSING:
        return "#5AC8FA"; // Blue
      case ORDER_STATUS.DISPATCHED:
        return "#007AFF"; // Blue
      case ORDER_STATUS.DELIVERED:
        return "#4CD964"; // Green
      case ORDER_STATUS.CANCELLED:
        return "#FF3B30"; // Red
      default:
        return "#666666"; // Gray
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        return <Clock size={16} color="#FFFFFF" />;
      case ORDER_STATUS.PICKED_UP:
        return <ShoppingBag size={16} color="#FFFFFF" />;
      case ORDER_STATUS.PROCESSING:
        return <Loader size={16} color="#FFFFFF" />;
      case ORDER_STATUS.DISPATCHED:
        return <Truck size={16} color="#FFFFFF" />;
      case ORDER_STATUS.DELIVERED:
        return <Package size={16} color="#FFFFFF" />;
      case ORDER_STATUS.CANCELLED:
        return <Check size={16} color="#FFFFFF" />;
      default:
        return <Clock size={16} color="#FFFFFF" />;
    }
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case ORDER_STATUS.PENDING:
        return ORDER_STATUS.PICKED_UP;
      case ORDER_STATUS.PICKED_UP:
        return ORDER_STATUS.PROCESSING;
      case ORDER_STATUS.PROCESSING:
        return ORDER_STATUS.DISPATCHED;
      case ORDER_STATUS.DISPATCHED:
        return ORDER_STATUS.DELIVERED;
      default:
        return null;
    }
  };

  const getStatusButtonLabel = (currentStatus) => {
    switch (currentStatus) {
      case ORDER_STATUS.PENDING:
        return "Mark as Picked Up";
      case ORDER_STATUS.PICKED_UP:
        return "Start Processing";
      case ORDER_STATUS.PROCESSING:
        return "Dispatch Order";
      case ORDER_STATUS.DISPATCHED:
        return "Mark as Delivered";
      default:
        return null;
    }
  };

  const handleChatWithCustomer = (order) => {
    navigation.navigate("SPChat", {
      orderId: order.id,
      serviceProviderId: order.serviceProviderId,
      serviceProviderName: auth.currentUser.displayName || "Service Provider",
      customerId: order.customerId,
      customerName: order.customerName || "Customer",
    });
  };

  const renderOrderActions = (order) => {
    const nextStatus = getNextStatus(order.status);
    const buttonLabel = getStatusButtonLabel(order.status);

    if (
      !nextStatus ||
      order.status === ORDER_STATUS.DELIVERED ||
      order.status === ORDER_STATUS.CANCELLED
    ) {
      return (
        <View style={styles.actionsContainer}>
          <View style={styles.completedOrderContainer}>
            <Text style={styles.completedOrderText}>
              {order.status === ORDER_STATUS.DELIVERED
                ? "Order completed successfully"
                : "Order was cancelled"}
            </Text>
          </View>

          {/* Add Chat Button */}
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => handleChatWithCustomer(order)}
          >
            <MessageCircle size={16} color="#FFFFFF" />
            <Text style={styles.chatButtonText}>Chat with Customer</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: getStatusColor(nextStatus) },
          ]}
          onPress={() => updateOrderStatus(order.id, nextStatus)}
        >
          <Text style={styles.actionButtonText}>{buttonLabel}</Text>
        </TouchableOpacity>

        {order.status === ORDER_STATUS.PENDING && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#F56565" }]}
            onPress={() => updateOrderStatus(order.id, ORDER_STATUS.CANCELLED)}
          >
            <Text style={styles.actionButtonText}>Cancel Order</Text>
          </TouchableOpacity>
        )}

        {/* Add Chat Button */}
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => handleChatWithCustomer(order)}
        >
          <MessageCircle size={16} color="#FFFFFF" />
          <Text style={styles.chatButtonText}>Chat with Customer</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderStatusTimeline = (order) => {
    const statuses = [
      ORDER_STATUS.PENDING,
      ORDER_STATUS.PICKED_UP,
      ORDER_STATUS.PROCESSING,
      ORDER_STATUS.DISPATCHED,
      ORDER_STATUS.DELIVERED,
    ];

    const currentIndex = statuses.findIndex(
      (status) => status === order.status
    );

    return (
      <View style={styles.timelineContainer}>
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
                  {getStatusIcon(status)}
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
                      color: isCompleted ? getStatusColor(status) : "#666666",
                      fontWeight: isCompleted ? "600" : "400",
                    },
                  ]}
                >
                  {status}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderOrderItem = ({ item }) => {
    const isExpanded = expandedOrderId === item.id;
    const hasMultipleServices = item.services && item.services.length > 0;

    return (
      <TouchableOpacity
        style={styles.orderItem}
        onPress={() => toggleOrderExpand(item.id)}
        activeOpacity={0.7}
      >
        {/* Order Header - Always Visible */}
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>
            Order #{item.orderId || item.id.substring(0, 8)}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        {/* Mini Summary - Always Visible */}
        <View style={styles.orderSummary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Customer:</Text>
            <Text style={styles.summaryValue}>
              {item.customerName || "Customer"}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service:</Text>
            <Text style={styles.summaryValue}>
              {hasMultipleServices
                ? `${item.services.length} services`
                : item.serviceType || "Laundry Service"}
            </Text>
          </View>

          <View style={styles.expandRow}>
            {isExpanded ? (
              <ChevronUp size={20} color="#4A6FA5" />
            ) : (
              <ChevronDown size={20} color="#4A6FA5" />
            )}
            <Text style={styles.expandText}>
              {isExpanded ? "Hide Details" : "View Details"}
            </Text>
          </View>
        </View>

        {/* Expanded Details */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Order Details */}
            <View style={styles.orderDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.label}>Date:</Text>
                <Text style={styles.value}>
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "N/A"}
                </Text>
              </View>
              {item.address && (
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Address:</Text>
                  <Text style={styles.value}>{item.address}</Text>
                </View>
              )}
            </View>

            {/* Schedule */}
            {(item.orderPickup || item.orderDropoff) && (
              <View style={styles.servicesList}>
                <Text style={styles.servicesTitle}>Schedule</Text>
                <View style={styles.scheduleContainer}>
                  {item.orderPickup && (
                    <View style={styles.scheduleItem}>
                      <Text style={styles.scheduleLabel}>Pickup:</Text>
                      <Text style={styles.scheduleValue}>
                        {item.orderPickup.date}
                      </Text>
                      <Text style={styles.scheduleValue}>
                        {item.orderPickup.time}
                      </Text>
                    </View>
                  )}

                  {item.orderDropoff && (
                    <View style={styles.scheduleItem}>
                      <Text style={styles.scheduleLabel}>Dropoff:</Text>
                      <Text style={styles.scheduleValue}>
                        {item.orderDropoff.date}
                      </Text>
                      <Text style={styles.scheduleValue}>
                        {item.orderDropoff.time}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Services */}
            <View style={styles.servicesList}>
              <Text style={styles.servicesTitle}>Services</Text>

              {hasMultipleServices ? (
                <>
                  {item.services.map((service, index) => (
                    <View key={index} style={styles.serviceItem}>
                      <View style={styles.serviceRow}>
                        <Text style={styles.serviceName}>
                          {service.serviceType}
                        </Text>
                        <Text style={styles.serviceQty}>
                          x{service.quantity}
                        </Text>
                      </View>
                      <Text style={styles.servicePrice}>
                        ${service.price.toFixed(2)} each
                      </Text>
                    </View>
                  ))}
                </>
              ) : (
                <View style={styles.serviceItem}>
                  <View style={styles.serviceRow}>
                    <Text style={styles.serviceName}>{item.serviceType}</Text>
                    <Text style={styles.serviceQty}>x1</Text>
                  </View>
                  <Text style={styles.servicePrice}>
                    ${item.price ? item.price.toFixed(2) : "0.00"} each
                  </Text>
                </View>
              )}

              {/* Total */}
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>
                  $
                  {hasMultipleServices
                    ? item.totalPrice.toFixed(2)
                    : item.price
                    ? item.price.toFixed(2)
                    : "0.00"}
                </Text>
              </View>
            </View>

            {/* Timeline */}
            {renderStatusTimeline(item)}

            {/* Action Buttons */}
            {renderOrderActions(item)}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#333333" />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View
          style={[
            styles.header,
            { paddingTop: insets.top > 0 ? insets.top : 20 },
          ]}
        >
          <Text style={styles.title}>Manage Orders</Text>
          <Clock color="#333333" size={24} />
        </View>

        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#333333"]}
              tintColor="#333333"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Package color="#666666" size={48} />
              <Text style={styles.emptyText}>No orders found</Text>
              <Text style={styles.emptySubText}>
                Pull down to refresh or check back later
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#ffffff",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333333",
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  orderItem: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
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
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  orderSummary: {
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  summaryLabel: {
    width: 80,
    fontSize: 14,
    color: "#666666",
  },
  summaryValue: {
    flex: 1,
    fontSize: 14,
    color: "#333333",
  },
  expandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  expandText: {
    fontSize: 14,
    color: "#4A6FA5",
    fontWeight: "500",
    marginLeft: 4,
  },
  expandedContent: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    paddingTop: 16,
  },
  orderDetails: {
    backgroundColor: "#F9F9FB",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  label: {
    width: 70,
    fontSize: 14,
    color: "#666666",
  },
  value: {
    flex: 1,
    fontSize: 14,
    color: "#333333",
  },
  servicesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 12,
    marginTop: 6,
  },
  scheduleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F9F9FB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  scheduleItem: {
    alignItems: "flex-start",
  },
  scheduleLabel: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 4,
  },
  scheduleValue: {
    fontSize: 14,
    color: "#333333",
    fontWeight: "500",
  },
  servicesList: {
    marginBottom: 16,
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
    paddingTop: 12,
    marginTop: 8,
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
  timelineContainer: {
    marginBottom: 20,
  },
  timelineStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
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
    height: 24,
    marginLeft: 14,
  },
  timelineTextContainer: {
    flex: 1,
    paddingLeft: 16,
    justifyContent: "center",
    height: 30,
  },
  timelineText: {
    fontSize: 14,
  },
  actionContainer: {
    flexDirection: "column",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  completedOrderContainer: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F9F9F9",
    alignItems: "center",
  },
  completedOrderText: {
    fontSize: 14,
    color: "#666666",
    fontStyle: "italic",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    flex: 1,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    color: "#666666",
    fontWeight: "600",
  },
  emptySubText: {
    marginTop: 8,
    fontSize: 14,
    color: "#999999",
    textAlign: "center",
  },
  actionsContainer: {
    marginTop: 12,
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4A6FA5",
    borderRadius: 8,
    padding: 14,
    marginTop: 12,
  },
  chatButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default ManageOrders;
