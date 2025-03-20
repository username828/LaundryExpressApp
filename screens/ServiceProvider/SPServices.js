import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { auth, firestore } from "../../firebaseConfig";

const SPServices = () => {
  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [servicesList, setServicesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;

      if (!currentUser) {
        Alert.alert("Error", "You must be logged in to manage services");
        setLoading(false);
        return;
      }

      const servicesQuery = query(
        collection(firestore, "services"),
        where("providerId", "==", currentUser.uid)
      );

      const querySnapshot = await getDocs(servicesQuery);
      const services = [];

      querySnapshot.forEach((doc) => {
        services.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setServicesList(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      Alert.alert("Error", "Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  const addService = async () => {
    if (!serviceName || !servicePrice) {
      Alert.alert("Error", "Please enter both service name and price");
      return;
    }

    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        Alert.alert("Error", "You must be logged in to add services");
        return;
      }

      const price = parseFloat(servicePrice);

      if (isNaN(price)) {
        Alert.alert("Error", "Price must be a valid number");
        return;
      }

      const newService = {
        name: serviceName,
        price: price,
        providerId: currentUser.uid,
        createdAt: new Date(),
      };

      const docRef = await addDoc(
        collection(firestore, "services"),
        newService
      );

      setServicesList([...servicesList, { id: docRef.id, ...newService }]);
      setServiceName("");
      setServicePrice("");

      Alert.alert("Success", "Service added successfully");
    } catch (error) {
      console.error("Error adding service:", error);
      Alert.alert("Error", "Failed to add service");
    }
  };

  const startEditing = (service) => {
    setEditingService(service);
    setServiceName(service.name);
    setServicePrice(service.price.toString());
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditingService(null);
    setServiceName("");
    setServicePrice("");
    setIsEditing(false);
  };

  const updateService = async () => {
    if (!serviceName || !servicePrice || !editingService) {
      Alert.alert("Error", "Please enter both service name and price");
      return;
    }

    try {
      const price = parseFloat(servicePrice);

      if (isNaN(price)) {
        Alert.alert("Error", "Price must be a valid number");
        return;
      }

      const serviceRef = doc(firestore, "services", editingService.id);

      await updateDoc(serviceRef, {
        name: serviceName,
        price: price,
        updatedAt: new Date(),
      });

      const updatedServices = servicesList.map((service) =>
        service.id === editingService.id
          ? { ...service, name: serviceName, price: price }
          : service
      );

      setServicesList(updatedServices);
      setServiceName("");
      setServicePrice("");
      setEditingService(null);
      setIsEditing(false);

      Alert.alert("Success", "Service updated successfully");
    } catch (error) {
      console.error("Error updating service:", error);
      Alert.alert("Error", "Failed to update service");
    }
  };

  const removeService = async (serviceId) => {
    try {
      await deleteDoc(doc(firestore, "services", serviceId));

      const newServicesList = servicesList.filter(
        (service) => service.id !== serviceId
      );
      setServicesList(newServicesList);

      Alert.alert("Success", "Service removed successfully");
    } catch (error) {
      console.error("Error removing service:", error);
      Alert.alert("Error", "Failed to remove service");
    }
  };

  const confirmRemove = (service) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete "${service.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: () => removeService(service.id),
          style: "destructive",
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading services...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Services</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Service Name"
          value={serviceName}
          onChangeText={setServiceName}
        />
        <TextInput
          style={styles.input}
          placeholder="Price ($)"
          value={servicePrice}
          onChangeText={setServicePrice}
          keyboardType="numeric"
        />

        {isEditing ? (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.updateButton]}
              onPress={updateService}
            >
              <Text style={styles.buttonText}>Update Service</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={cancelEditing}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.addButton]}
            onPress={addService}
          >
            <Text style={styles.buttonText}>Add Service</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.listTitle}>Your Services</Text>

      {servicesList.length === 0 ? (
        <Text style={styles.emptyMessage}>No services added yet</Text>
      ) : (
        <FlatList
          data={servicesList}
          keyExtractor={(item) => item.id}
          style={styles.list}
          renderItem={({ item }) => (
            <View style={styles.serviceItem}>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{item.name}</Text>
                <Text style={styles.servicePrice}>
                  ${item.price.toFixed(2)}
                </Text>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity onPress={() => startEditing(item)}>
                  <Text style={styles.editButton}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmRemove(item)}>
                  <Text style={styles.removeButton}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 24,
    color: "#333333",
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 24,
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    height: 50,
    borderColor: "#e0e0e0",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    backgroundColor: "#f9f9f9",
    fontSize: 15,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    minHeight: 50,
  },
  addButton: {
    backgroundColor: "#333333",
  },
  updateButton: {
    backgroundColor: "#333333",
    flex: 1,
    marginRight: 8,
  },
  cancelButton: {
    backgroundColor: "#f44336",
    flex: 1,
    marginLeft: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 15,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    marginTop: 8,
    color: "#333333",
  },
  list: {
    width: "100%",
  },
  serviceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  servicePrice: {
    fontSize: 15,
    color: "#666666",
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  editButton: {
    color: "#333333",
    marginRight: 16,
    fontWeight: "600",
    padding: 4,
  },
  removeButton: {
    color: "#f44336",
    fontWeight: "600",
    padding: 4,
  },
  emptyMessage: {
    textAlign: "center",
    marginTop: 24,
    color: "#666666",
    fontSize: 16,
  },
});

export default SPServices;
