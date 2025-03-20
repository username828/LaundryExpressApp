import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";

const ServiceProviderOptions = () => {
  const navigation = useNavigation();

  const handleAccountDetails = () => {
    navigation.navigate("SPAccountDetails");
  };

  const handleServices = () => {
    navigation.navigate("SPServices");
  };

  const handleManageOrders = () => {
    navigation.navigate("ManageOrders");
  };

  const handleManageComplaints = () => {
    navigation.navigate("ManageComplaints");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Service Provider Options</Text>
      <TouchableOpacity style={styles.button} onPress={handleAccountDetails}>
        <Text style={styles.buttonText}>Account Details</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleServices}>
        <Text style={styles.buttonText}>Services</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleManageOrders}>
        <Text style={styles.buttonText}>Manage Orders</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleManageComplaints}>
        <Text style={styles.buttonText}>Manage Complaints</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 32,
    color: "#333333",
    textAlign: "center",
  },
  button: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginVertical: 10,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  buttonText: {
    color: "#333333",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ServiceProviderOptions;
