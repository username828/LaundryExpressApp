import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import React from "react";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons"; // Import icons

const Orders = ({ order }) => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={styles.orderContainer}
      onPress={() =>
        navigation.navigate("Track", {
          orderId: order.orderId,
          providerId: order.providerId,
        })
      }
    >
      {/* Order ID */}
      <View style={styles.row}>
        <Icon name="file-document-outline" size={20} color="#007bff" />
        <Text style={styles.orderId}> Order ID: {order.orderId}</Text>
      </View>

      {/* Service Type */}
      <View style={styles.row}>
        <Icon name="washing-machine" size={20} color="#28a745" />
        <Text style={styles.serviceType}> Service: {order.serviceType}</Text>
      </View>

      {/* Status */}
      <View style={styles.row}>
        <Icon
          name="progress-clock"
          size={20}
          color={order.status === "Completed" ? "#28a745" : "#f39c12"}
        />
        <Text
          style={[
            styles.status,
            order.status === "Completed" ? styles.completed : styles.pending,
          ]}
        >
          {order.status}
        </Text>
      </View>

      {/* Price */}
      <View style={styles.row}>
        <Icon name="currency-usd" size={20} color="#ff5733" />
        <Text style={styles.price}> ${order.price}</Text>
      </View>

      {/* Address */}
      <View style={styles.row}>
        <Icon name="map-marker-outline" size={20} color="#6c757d" />
        <Text style={styles.address}> {order.address}</Text>
      </View>

      {/* Date & Time */}
      <View style={styles.row}>
        <Icon name="calendar-clock" size={20} color="#17a2b8" />
        <Text style={styles.createdAt}> {order.orderTime}</Text>
      </View>

      {/* Raise Complaint Button */}
      <TouchableOpacity
        style={styles.complaintButton}
        onPress={() =>
          navigation.navigate("FileComplaint", {
            orderId: order.orderId,
            providerId: order.serviceProviderId,
          })
        }
      >
        <Icon name="alert-circle-outline" size={20} color="#fff" style={styles.buttonIcon} />
        <Text style={styles.buttonText}>Raise Complaint</Text>
      </TouchableOpacity>


    </TouchableOpacity>
  );
};

export default Orders;

const styles = StyleSheet.create({
  orderContainer: {
    padding: 15,
    marginBottom: 10,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderLeftWidth: 5,
    borderLeftColor: "#007bff",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007bff",
  },
  serviceType: {
    fontSize: 15,
    color: "#333",
  },
  status: {
    fontSize: 15,
    fontWeight: "bold",
  },
  completed: {
    color: "#28a745", // Green for completed orders
  },
  pending: {
    color: "#f39c12", // Orange for pending orders
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff5733",
  },
  address: {
    fontSize: 14,
    color: "#6c757d",
  },
  createdAt: {
    fontSize: 13,
    color: "#17a2b8",
  },
  complaintButton: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dc3545", // Red color for attention
    paddingVertical: 10,
    borderRadius: 5,
    justifyContent: "center",
  },
  buttonIcon: {
    marginRight: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
