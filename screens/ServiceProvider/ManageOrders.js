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
} from "lucide-react-native";
import { auth } from "../../firebaseConfig";
import {
  SafeAreaView,
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

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

      const querySnapshot = await getDocs(ordersQuery);
      const ordersList = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort((a, b) => {
          // Sort by createdAt in descending order
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });
      setOrders(ordersList);
    } catch (error) {
      console.error("Error fetching orders: ", error);
      Alert.alert("Error", "Could not fetch orders. Please try again later.", [
        { text: "OK" },
      ]);
    } finally {
      setLoading(false);
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
        return <Clock color="#FFA500" size={20} />;
      case ORDER_STATUS.PICKED_UP:
        return <ShoppingBag color="#FF9500" size={20} />;
      case ORDER_STATUS.PROCESSING:
        return <Loader color="#5AC8FA" size={20} />;
      case ORDER_STATUS.DISPATCHED:
        return <Truck color="#007AFF" size={20} />;
      case ORDER_STATUS.DELIVERED:
        return <Package color="#4CD964" size={20} />;
      case ORDER_STATUS.CANCELLED:
        return <Check color="#FF3B30" size={20} />;
      default:
        return <Clock color="#666666" size={20} />;
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

  const renderOrderActions = (order) => {
    const nextStatus = getNextStatus(order.status);
    const buttonLabel = getStatusButtonLabel(order.status);

    if (
      !nextStatus ||
      order.status === ORDER_STATUS.DELIVERED ||
      order.status === ORDER_STATUS.CANCELLED
    ) {
      return (
        <View style={styles.completedOrderContainer}>
          <Text style={styles.completedOrderText}>
            {order.status === ORDER_STATUS.DELIVERED
              ? "Order completed successfully"
              : "Order was cancelled"}
          </Text>
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
          {getStatusIcon(nextStatus)}
          <Text style={styles.actionButtonText}>{buttonLabel}</Text>
        </TouchableOpacity>

        {order.status === ORDER_STATUS.PENDING && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: "#FF3B30", marginTop: 8 },
            ]}
            onPress={() => updateOrderStatus(order.id, ORDER_STATUS.CANCELLED)}
          >
            <Text style={styles.actionButtonText}>Cancel Order</Text>
          </TouchableOpacity>
        )}
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
                    isCompleted
                      ? { backgroundColor: getStatusColor(status) }
                      : styles.incompleteIcon,
                  ]}
                >
                  {getStatusIcon(status)}
                </View>
                {!isLast && (
                  <View
                    style={[
                      styles.timelineLine,
                      isCompleted
                        ? { backgroundColor: getStatusColor(status) }
                        : null,
                    ]}
                  />
                )}
              </View>
              <View style={styles.timelineTextContainer}>
                <Text
                  style={[
                    styles.timelineText,
                    isCompleted
                      ? { color: getStatusColor(status), fontWeight: "600" }
                      : null,
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
            <View style={styles.statusIconContainer}>
              {getStatusIcon(item.status)}
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
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
              {item.serviceType || "Laundry Service"}
            </Text>
          </View>

          <View style={styles.expandRow}>
            {isExpanded ? (
              <ChevronUp size={20} color="#333333" />
            ) : (
              <ChevronDown size={20} color="#333333" />
            )}
            <Text style={styles.expandText}>
              {isExpanded ? "Hide Details" : "View Details"}
            </Text>
          </View>
        </View>

        {/* Expanded Details */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.orderDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.label}>Price:</Text>
                <Text style={styles.value}>${item.price || "0.00"}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.label}>Date:</Text>
                <Text style={styles.value}>
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString()
                    : "N/A"}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.label}>Time:</Text>
                <Text style={styles.value}>{item.orderTime || "N/A"}</Text>
              </View>
              {item.address && (
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Address:</Text>
                  <Text style={styles.value}>{item.address}</Text>
                </View>
              )}
              {item.notes && (
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Notes:</Text>
                  <Text style={styles.value}>{item.notes}</Text>
                </View>
              )}
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
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
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
    borderRadius: 12,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
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
    fontWeight: "500",
  },
  summaryValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
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
    color: "#333333",
    fontWeight: "500",
    marginLeft: 4,
  },
  expandedContent: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 12,
  },
  orderDetails: {
    marginBottom: 16,
    backgroundColor: "#f9f9f9",
    padding: 14,
    borderRadius: 8,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "flex-start",
  },
  label: {
    width: 80,
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
  value: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#333333",
  },
  timelineContainer: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  timelineStep: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  timelineIconSection: {
    alignItems: "center",
    width: 40,
  },
  timelineIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#333333",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  incompleteIcon: {
    backgroundColor: "#e0e0e0",
  },
  timelineLine: {
    width: 2,
    height: 30,
    backgroundColor: "#e0e0e0",
  },
  timelineTextContainer: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: "center",
    height: 36,
    marginBottom: 6,
  },
  timelineText: {
    fontSize: 14,
    color: "#666666",
  },
  actionContainer: {
    flexDirection: "column",
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 8,
    gap: 8,
    backgroundColor: "#333333",
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  completedOrderContainer: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
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
});

export default ManageOrders;
