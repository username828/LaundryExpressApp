import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Dimensions,
} from "react-native";
import { getAuth } from "firebase/auth";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useNavigation } from "@react-navigation/native";

// Import custom components
import Header from "../../components/Header";
import { useTheme } from "../../theme/ThemeContext";
import Card from "../../components/Card";
import Button from "../../components/Button";

const auth = getAuth();
const { width } = Dimensions.get("window");

const ORDER_STATUS = {
  PENDING: "Order Placed",
  PICKED_UP: "Picked Up",
  PROCESSING: "Order Processing",
  DISPATCHED: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const OrderScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("current");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "orders"),
      where("customerId", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
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

    return () => unsubscribe();
  }, []);

  // Filter orders based on the status and active tab
  const filteredOrders = orders.filter((order) =>
    activeTab === "current"
      ? [
          ORDER_STATUS.PENDING,
          ORDER_STATUS.PICKED_UP,
          ORDER_STATUS.PROCESSING,
          ORDER_STATUS.DISPATCHED,
        ].includes(order.status)
      : [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED].includes(order.status)
  );

  const handleReviewOrder = async (order) => {
    if (!order.reviewed) {
      navigation.navigate("Rating", {
        orderId: order.id,
        providerId: order.serviceProviderId,
      });
    } else {
      Alert.alert(
        "Already Reviewed",
        "You have already submitted a review for this order."
      );
    }
  };

  // Render order item with our new Card component
  const renderOrderItem = (order) => {
    const formattedDate = order.createdAt
      ? new Date(order.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "N/A";
    const totalItems = order.services
      ? order.services.reduce((sum, service) => sum + service.quantity, 0)
      : 0;

    const getStatusColor = (status) => {
      switch (status) {
        case ORDER_STATUS.PENDING:
          return theme.colors.warning;
        case ORDER_STATUS.PICKED_UP:
          return theme.colors.info;
        case ORDER_STATUS.PROCESSING:
          return theme.colors.primary;
        case ORDER_STATUS.DISPATCHED:
          return theme.colors.secondary;
        case ORDER_STATUS.DELIVERED:
          return theme.colors.success;
        case ORDER_STATUS.CANCELLED:
          return theme.colors.error;
        default:
          return theme.colors.text;
      }
    };

    return (
      <Card key={order.id} style={styles.orderCard}>
        {/* Order Header with ID and Status */}
        <View style={styles.orderHeader}>
          <Text style={[styles.orderId, { color: theme.colors.primary }]}>
            Order #
            {order.orderId
              ? order.orderId.substring(0, 8)
              : order.id.substring(0, 8)}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(order.status) },
            ]}
          >
            <Text style={[styles.statusText, { color: theme.colors.white }]}>
              {order.status}
            </Text>
          </View>
        </View>

        {/* Order Details */}
        <View style={styles.orderContent}>
          <View style={styles.detailRow}>
            <View style={styles.orderDetail}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color={theme.colors.textLight}
              />
              <Text
                style={[styles.orderDetailText, { color: theme.colors.text }]}
              >
                {formattedDate}
              </Text>
            </View>

            <View style={styles.orderDetail}>
              <Ionicons
                name="cart-outline"
                size={16}
                color={theme.colors.textLight}
              />
              <Text
                style={[styles.orderDetailText, { color: theme.colors.text }]}
              >
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <Ionicons
              name="cash-outline"
              size={16}
              color={theme.colors.textLight}
            />
            <Text style={[styles.priceText, { color: theme.colors.text }]}>
              $
              {order.totalPrice
                ? order.totalPrice.toFixed(2)
                : order.price
                ? order.price.toFixed(2)
                : "0.00"}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {order.status !== ORDER_STATUS.DELIVERED &&
            order.status !== ORDER_STATUS.CANCELLED && (
              <Button
                title="Track Order"
                icon="navigate"
                size="small"
                style={{ flex: 1 }}
                onPress={() =>
                  navigation.navigate("Track", {
                    orderId: order.id,
                    providerId: order.serviceProviderId,
                  })
                }
              />
            )}

          {order.status === ORDER_STATUS.DELIVERED && !order.reviewed && (
            <Button
              title="Leave Review"
              icon="star"
              size="small"
              variant="primary"
              style={{ flex: 1, marginRight: 10 }}
              onPress={() => handleReviewOrder(order)}
            />
          )}

          {order.status === ORDER_STATUS.DELIVERED && (
            <Button
              title="File Complaint"
              icon="alert-circle-outline"
              size="small"
              variant="error"
              style={{ flex: 1 }}
              onPress={() =>
                navigation.navigate("FileComplaint", {
                  orderId: order.id,
                  providerId: order.serviceProviderId,
                })
              }
            />
          )}
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Header title="My Orders" />

      {/* Tab Buttons */}
      <View style={styles.tabsWrapper}>
        <View
          style={[styles.tabContainer, { backgroundColor: theme.colors.card }]}
        >
          <TouchableOpacity
            onPress={() => setActiveTab("current")}
            style={[
              styles.tabButton,
              {
                backgroundColor:
                  activeTab === "current"
                    ? theme.colors.primaryLight
                    : "transparent",
              },
            ]}
          >
            <Ionicons
              name="time-outline"
              size={20}
              color={
                activeTab === "current"
                  ? theme.colors.primary
                  : theme.colors.textLight
              }
              style={styles.tabIcon}
            />
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "current"
                      ? "#FFFFFF"
                      : theme.colors.textLight,
                  fontWeight: activeTab === "current" ? "600" : "500",
                },
              ]}
            >
              Current Orders
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("completed")}
            style={[
              styles.tabButton,
              {
                backgroundColor:
                  activeTab === "completed"
                    ? theme.colors.primaryLight
                    : "transparent",
              },
            ]}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={20}
              color={
                activeTab === "completed"
                  ? theme.colors.primary
                  : theme.colors.textLight
              }
              style={styles.tabIcon}
            />
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "completed"
                      ? "#FFFFFF"
                      : theme.colors.textLight,
                  fontWeight: activeTab === "completed" ? "600" : "500",
                },
              ]}
            >
              Past Orders
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Orders List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textLight }]}>
            Loading your orders...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.ordersContainer}
          contentContainerStyle={styles.ordersContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => renderOrderItem(order))
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons
                name={
                  activeTab === "current"
                    ? "basket-outline"
                    : "checkmark-done-circle-outline"
                }
                size={70}
                color={theme.colors.border}
              />
              <Text style={[styles.noOrdersText, { color: theme.colors.text }]}>
                {activeTab === "current"
                  ? "No Current Orders"
                  : "No Past Orders"}
              </Text>
              <Text
                style={[
                  styles.noOrdersSubtext,
                  { color: theme.colors.textLight },
                ]}
              >
                {activeTab === "current"
                  ? "Your active orders will appear here"
                  : "Your completed orders will appear here"}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  tabContainer: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginHorizontal: 1,
    borderRadius: 12,
  },
  tabIcon: {
    marginRight: 8,
  },
  tabText: {
    fontSize: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  ordersContainer: {
    flex: 1,
  },
  ordersContent: {
    padding: 16,
    paddingBottom: 30,
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 32,
  },
  noOrdersText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  noOrdersSubtext: {
    marginTop: 10,
    fontSize: 14,
    textAlign: "center",
    maxWidth: width * 0.7,
  },
  orderCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    padding: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  orderContent: {
    marginBottom: 12,
    paddingHorizontal: 14,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  orderDetail: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderDetailText: {
    marginLeft: 8,
    fontSize: 14,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 12,
    marginHorizontal: 12,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
});

export default OrderScreen;
