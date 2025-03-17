import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  RefreshControl,
} from "react-native";
import { db } from "../../firebaseConfig";
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
  CircleCheck as CheckCircle2,
  Circle as XCircle,
  Package,
} from "lucide-react-native";
import { getAuth } from "firebase/auth";

// Order status constants
const ORDER_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        Alert.alert("Error", "User not logged in.");
        return;
      }

      const serviceProviderId = user.uid;
      const ordersQuery = query(
        collection(db, "orders"),
        where("serviceProviderId", "==", serviceProviderId)
      );

      const querySnapshot = await getDocs(ordersQuery);
      const ordersList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
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

      Alert.alert("Success", `Order ${newStatus} successfully`, [
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
        return "#FFA500";
      case ORDER_STATUS.ACCEPTED:
        return "#007BFF";
      case ORDER_STATUS.COMPLETED:
        return "#28A745";
      case ORDER_STATUS.CANCELLED:
        return "#DC3545";
      default:
        return "#6C757D";
    }
  };

  const renderOrderActions = (order) => {
    switch (order.status) {
      case ORDER_STATUS.PENDING:
        return (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#28A745" }]}
              onPress={() => updateOrderStatus(order.id, ORDER_STATUS.ACCEPTED)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#DC3545" }]}
              onPress={() =>
                updateOrderStatus(order.id, ORDER_STATUS.CANCELLED)
              }
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}>Decline</Text>
            </TouchableOpacity>
          </View>
        );
      case ORDER_STATUS.ACCEPTED:
        return (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: "#28A745", width: "100%" },
            ]}
            onPress={() => updateOrderStatus(order.id, ORDER_STATUS.COMPLETED)}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>Mark as Completed</Text>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderItem}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Order #{item.orderId}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Customer:</Text>
          <Text style={styles.value}>{item.customerName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Service:</Text>
          <Text style={styles.value}>{item.serviceType}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Price:</Text>
          <Text style={styles.value}>${item.price}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {renderOrderActions(item)}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
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
          </View>
        }
      />
    </SafeAreaView>
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
    padding: 20,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  orderDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "center",
  },
  label: {
    width: 80,
    fontSize: 14,
    color: "#666",
  },
  value: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  actionButton: {
    flex: 1,
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
    fontSize: 16,
    color: "#666",
  },
});

export default ManageOrders;