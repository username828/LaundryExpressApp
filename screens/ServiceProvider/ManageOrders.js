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
  CheckCircle,
  Truck,
  ShoppingBag,
  Loader,
} from "lucide-react-native";
import { auth } from "../../firebaseConfig";
import {
  SafeAreaView,
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

// Order status constants
const ORDER_STATUS = {
  PENDING: "pending",
  RECEIVED: "received",
  PROCESSING: "processing",
  COMPLETED: "completed",
  DISPATCHED: "dispatched",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
          return new Date(b.createdAt) - new Date(a.createdAt);
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

      Alert.alert("Success", `Order marked as ${newStatus} successfully`, [
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
      case ORDER_STATUS.RECEIVED:
        return "#007BFF"; // Blue
      case ORDER_STATUS.PROCESSING:
        return "#6610f2"; // Purple
      case ORDER_STATUS.COMPLETED:
        return "#28A745"; // Green
      case ORDER_STATUS.DISPATCHED:
        return "#17a2b8"; // Teal
      case ORDER_STATUS.DELIVERED:
        return "#20c997"; // Mint
      case ORDER_STATUS.CANCELLED:
        return "#DC3545"; // Red
      default:
        return "#6C757D"; // Gray
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        return <Clock color="#FFA500" size={20} />;
      case ORDER_STATUS.RECEIVED:
        return <ShoppingBag color="#007BFF" size={20} />;
      case ORDER_STATUS.PROCESSING:
        return <Loader color="#6610f2" size={20} />;
      case ORDER_STATUS.COMPLETED:
        return <CheckCircle color="#28A745" size={20} />;
      case ORDER_STATUS.DISPATCHED:
        return <Truck color="#17a2b8" size={20} />;
      case ORDER_STATUS.DELIVERED:
        return <Package color="#20c997" size={20} />;
      case ORDER_STATUS.CANCELLED:
        return <CheckCircle color="#DC3545" size={20} />;
      default:
        return <Clock color="#6C757D" size={20} />;
    }
  };

  const renderOrderActions = (order) => {
    // Define which buttons to show based on current status
    const getNextStatusButtons = () => {
      switch (order.status) {
        case ORDER_STATUS.PENDING:
          return [
            {
              label: "Order Received",
              status: ORDER_STATUS.RECEIVED,
              color: "#007BFF",
            },
            {
              label: "Cancel Order",
              status: ORDER_STATUS.CANCELLED,
              color: "#DC3545",
            },
          ];
        case ORDER_STATUS.RECEIVED:
          return [
            {
              label: "Start Processing",
              status: ORDER_STATUS.PROCESSING,
              color: "#6610f2",
            },
          ];
        case ORDER_STATUS.PROCESSING:
          return [
            {
              label: "Mark Completed",
              status: ORDER_STATUS.COMPLETED,
              color: "#28A745",
            },
          ];
        case ORDER_STATUS.COMPLETED:
          return [
            {
              label: "Dispatch Order",
              status: ORDER_STATUS.DISPATCHED,
              color: "#17a2b8",
            },
          ];
        case ORDER_STATUS.DISPATCHED:
          return [
            {
              label: "Mark Delivered",
              status: ORDER_STATUS.DELIVERED,
              color: "#20c997",
            },
          ];
        case ORDER_STATUS.DELIVERED:
        case ORDER_STATUS.CANCELLED:
          return []; // No actions for delivered or cancelled orders
        default:
          return [];
      }
    };

    const buttons = getNextStatusButtons();

    if (buttons.length === 0) {
      return null;
    }

    return (
      <View style={styles.actionContainer}>
        {buttons.map((button, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.actionButton, { backgroundColor: button.color }]}
            onPress={() => updateOrderStatus(order.id, button.status)}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>{button.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderItem}>
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
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Customer:</Text>
          <Text style={styles.value}>{item.customerName || "Customer"}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Service:</Text>
          <Text style={styles.value}>
            {item.serviceType || "Laundry Service"}
          </Text>
        </View>
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

      {renderOrderActions(item)}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
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
          <Clock color="#666" size={24} />
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
              colors={["#007BFF"]}
              tintColor="#007BFF"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Package color="#666" size={48} />
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
    backgroundColor: "#f9f9f9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  orderItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
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
  orderDetails: {
    marginBottom: 16,
    backgroundColor: "#f9f9f9",
    padding: 12,
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
    color: "#666",
    fontWeight: "500",
  },
  value: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  actionContainer: {
    flexDirection: "column",
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
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
    color: "#666",
    fontWeight: "600",
  },
  emptySubText: {
    marginTop: 8,
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
});

export default ManageOrders;