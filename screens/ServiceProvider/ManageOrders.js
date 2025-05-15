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
  StatusBar,
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
  Calendar,
} from "lucide-react-native";
import { auth } from "../../firebaseConfig";
import {
  SafeAreaView,
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../theme/ThemeContext";
import { Header } from "../../components/Header";

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
  const theme = useTheme();

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
      // For pick-up and delivery status changes, use the verification screen instead
      if (newStatus === ORDER_STATUS.PICKED_UP) {
        navigation.navigate("SPOrderVerificationScreen", {
          orderId: orderId,
          verificationStage: "pickup",
        });
        return;
      } else if (newStatus === ORDER_STATUS.DELIVERED) {
        navigation.navigate("SPOrderVerificationScreen", {
          orderId: orderId,
          verificationStage: "dropoff",
        });
        return;
      }

      // For other status changes, update directly
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
        return theme.colors.warning; // Orange
      case ORDER_STATUS.PICKED_UP:
        return theme.colors.warning; // Dark Orange
      case ORDER_STATUS.PROCESSING:
        return theme.colors.info; // Blue
      case ORDER_STATUS.DISPATCHED:
        return theme.colors.primary; // Blue
      case ORDER_STATUS.DELIVERED:
        return theme.colors.success; // Green
      case ORDER_STATUS.CANCELLED:
        return theme.colors.error; // Red
      default:
        return theme.colors.textLight; // Gray
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
            style={[
              styles.chatButton,
              { backgroundColor: theme.colors.primary },
            ]}
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
        {/* Add verification button for Pending orders (before pickup) */}
        {order.status === ORDER_STATUS.PENDING && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: theme.colors.info },
            ]}
            onPress={() =>
              navigation.navigate("SPOrderVerificationScreen", {
                orderId: order.id,
                verificationStage: "pickup",
              })
            }
          >
            <ShoppingBag
              size={16}
              color="#FFFFFF"
              style={styles.actionButtonIcon}
            />
            <Text style={styles.actionButtonText}>Verify Pickup Items</Text>
          </TouchableOpacity>
        )}

        {/* Add verification button for Dispatched orders (before delivery) */}
        {order.status === ORDER_STATUS.DISPATCHED && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: theme.colors.info },
            ]}
            onPress={() =>
              navigation.navigate("SPOrderVerificationScreen", {
                orderId: order.id,
                verificationStage: "dropoff",
              })
            }
          >
            <Package
              size={16}
              color="#FFFFFF"
              style={styles.actionButtonIcon}
            />
            <Text style={styles.actionButtonText}>Verify Delivery Items</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: getStatusColor(nextStatus) },
          ]}
          onPress={() => updateOrderStatus(order.id, nextStatus)}
        >
          {nextStatus === ORDER_STATUS.PICKED_UP && (
            <ShoppingBag
              size={16}
              color="#FFFFFF"
              style={styles.actionButtonIcon}
            />
          )}
          {nextStatus === ORDER_STATUS.PROCESSING && (
            <Loader size={16} color="#FFFFFF" style={styles.actionButtonIcon} />
          )}
          {nextStatus === ORDER_STATUS.DISPATCHED && (
            <Truck size={16} color="#FFFFFF" style={styles.actionButtonIcon} />
          )}
          {nextStatus === ORDER_STATUS.DELIVERED && (
            <Package
              size={16}
              color="#FFFFFF"
              style={styles.actionButtonIcon}
            />
          )}
          <Text style={styles.actionButtonText}>{buttonLabel}</Text>
        </TouchableOpacity>

        {order.status === ORDER_STATUS.PENDING && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: theme.colors.error },
            ]}
            onPress={() => updateOrderStatus(order.id, ORDER_STATUS.CANCELLED)}
          >
            <Check size={16} color="#FFFFFF" style={styles.actionButtonIcon} />
            <Text style={styles.actionButtonText}>Cancel Order</Text>
          </TouchableOpacity>
        )}

        {/* Add Chat Button */}
        <TouchableOpacity
          style={[styles.chatButton, { backgroundColor: theme.colors.primary }]}
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
            {getStatusIcon(item.status)}
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

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date:</Text>
            <Text style={styles.summaryValue}>
              {item.createdAt
                ? new Date(item.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "N/A"}
            </Text>
          </View>

          <View style={styles.expandRow}>
            <Text style={styles.expandText}>
              {isExpanded ? "Hide Details" : "View Details"}
            </Text>
            {isExpanded ? (
              <ChevronUp size={18} color={theme.colors.primary} />
            ) : (
              <ChevronDown size={18} color={theme.colors.primary} />
            )}
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
                <View style={styles.sectionTitleRow}>
                  <Calendar size={16} color={theme.colors.text} />
                  <Text style={styles.servicesTitle}>Schedule</Text>
                </View>
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
              <View style={styles.sectionTitleRow}>
                <ShoppingBag size={16} color={theme.colors.text} />
                <Text style={styles.servicesTitle}>Services</Text>
              </View>

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
                <Text
                  style={[styles.totalValue, { color: theme.colors.primary }]}
                >
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
            <View style={styles.sectionTitleRow}>
              <Clock size={16} color={theme.colors.text} />
              <Text style={styles.servicesTitle}>Order Status</Text>
            </View>
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
          <StatusBar barStyle="light-content" />
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDark]}
          style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}
        >
          <View style={styles.headerContent}>
            <Text style={styles.title}>Manage Orders</Text>
            <Text style={styles.subtitle}>
              Track and update customer orders
            </Text>
          </View>
        </LinearGradient>

        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View
                style={[
                  styles.emptyIconContainer,
                  { backgroundColor: theme.colors.primary + "15" },
                ]}
              >
                <Package color={theme.colors.primary} size={48} />
              </View>
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
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerContent: {
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f0f0f0",
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
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
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
    marginTop: 12,
  },
  expandText: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 4,
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
    borderRadius: 12,
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
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  servicesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginLeft: 8,
  },
  scheduleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F9F9FB",
    borderRadius: 12,
    padding: 16,
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
    padding: 16,
    borderRadius: 12,
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
    fontSize: 16,
    fontWeight: "700",
  },
  timelineContainer: {
    marginBottom: 20,
  },
  timelineStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
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
    height: 26,
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
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionButtonIcon: {
    marginRight: 6,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  completedOrderContainer: {
    padding: 16,
    borderRadius: 12,
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
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666666",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    paddingTop: 60,
    flex: 1,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    color: "#333333",
    fontWeight: "600",
  },
  emptySubText: {
    marginTop: 8,
    fontSize: 14,
    color: "#999999",
    textAlign: "center",
    maxWidth: "80%",
  },
  actionsContainer: {
    marginTop: 12,
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  chatButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default ManageOrders;
