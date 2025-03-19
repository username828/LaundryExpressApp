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

  const handleManageComplaints=()=>{
    navigation.navigate("ManageComplaints");
  }

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
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#007BFF",
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 30,
    marginVertical: 10,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default ServiceProviderOptions;