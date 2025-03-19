import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Orders from "../../components/Orders";
import { getAuth } from "firebase/auth";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../firebaseConfig";
const auth = getAuth(); // Initialize Firebase Auth

const OrderScreen = () => {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("current"); // Default to 'current' tab
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!auth.currentUser) return;
  
    const q = query(
      collection(db, "orders"),
      where("customerId", "==", auth.currentUser.uid)
    );

   
  
    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(ordersData)
      setOrders(ordersData);
      setLoading(false)
    });
  
    return () => unsubscribe(); // Cleanup listener when component unmounts
  }, []);

  // Filter orders based on the status and active tab
  const filteredOrders = orders.filter((order) =>
    activeTab === "current"
      ? [
          "Order Placed",
          "Picked Up",
          "Washing",
          "Ironing",
          "Out for Delivery",
        ].includes(order.status)
      : order.status === "Delivered"
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={[styles.header, { marginTop: insets.top > 0 ? 0 : 20 }]}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      {/* Tab Buttons */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab("current")}
          style={[
            styles.tabButton,
            activeTab === "current" && styles.activeTab,
          ]}
        >
          <Ionicons
            name="time-outline"
            size={18}
            color={activeTab === "current" ? "#007AFF" : "#8E8E93"}
            style={styles.tabIcon}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "current" && styles.activeTabText,
            ]}
          >
            Current Orders
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("completed")}
          style={[
            styles.tabButton,
            activeTab === "completed" && styles.activeTab,
          ]}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={18}
            color={activeTab === "completed" ? "#007AFF" : "#8E8E93"}
            style={styles.tabIcon}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "completed" && styles.activeTabText,
            ]}
          >
            Completed Orders
          </Text>
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.ordersContainer}
          contentContainerStyle={styles.ordersContent}
        >
          {console.log("Filtered: ",filteredOrders)}
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <Orders key={order.orderId} order={order} />
            ))
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons
                name={
                  activeTab === "current"
                    ? "basket-outline"
                    : "checkmark-done-circle-outline"
                }
                size={60}
                color="#CCCCCC"
              />
              <Text style={styles.noOrdersText}>
                {activeTab === "current"
                  ? "No current orders"
                  : "No completed orders yet"}
              </Text>
              <Text style={styles.noOrdersSubtext}>
                {activeTab === "current"
                  ? "Your active orders will appear here"
                  : "Your order history will appear here once completed"}
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
    backgroundColor: "#F2F2F7",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
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
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: "#F2F2F7",
  },
  activeTab: {
    backgroundColor: "#E5F0FF",
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#8E8E93",
  },
  activeTabText: {
    color: "#007AFF",
    fontWeight: "600",
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
    marginTop: 40,
  },
  noOrdersText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "#3C3C43",
    textAlign: "center",
  },
  noOrdersSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
  },
});

export default OrderScreen;