import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
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
import { auth, db as firestore } from "../../firebaseConfig";
import { Ionicons } from "@expo/vector-icons";

const SERVICE_CATEGORIES = [
  {
    id: "clothes",
    name: "Clothes",
    subcategories: ["Wash and Fold", "Dry Clean", "Iron"],
    icon: "shirt-outline",
  },
  {
    id: "shoes",
    name: "Shoes",
    subcategories: ["Wash"],
    icon: "footsteps-outline",
  },
  {
    id: "carpet",
    name: "Carpet",
    subcategories: ["Wash"],
    icon: "grid-outline",
  },
  {
    id: "luxury",
    name: "Luxury Wear",
    subcategories: ["Dry Clean", "Iron"],
    icon: "diamond-outline",
  },
  {
    id: "curtains",
    name: "Curtains",
    subcategories: ["Wash"],
    icon: "browsers-outline",
  },
  {
    id: "blankets",
    name: "Blankets",
    subcategories: ["Wash"],
    icon: "bed-outline",
  },
];

const SPServices = () => {
  const [servicesList, setServicesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [servicePrice, setServicePrice] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [subcategoryModalVisible, setSubcategoryModalVisible] = useState(false);

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

  const openAddServiceModal = () => {
    setModalVisible(true);
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setServicePrice("");
    setIsEditing(false);
    setEditingService(null);
  };

  const openSubcategoryModal = (category) => {
    setSelectedCategory(category);
    setSubcategoryModalVisible(true);
  };

  const selectSubcategory = (subcategory) => {
    setSelectedSubcategory(subcategory);
    setSubcategoryModalVisible(false);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setServicePrice("");
  };

  const startEditing = (service) => {
    setEditingService(service);
    setServicePrice(service.price.toString());
    setSelectedCategory(
      SERVICE_CATEGORIES.find((cat) => cat.name === service.category)
    );
    setSelectedSubcategory(service.subcategory);
    setIsEditing(true);
    setModalVisible(true);
  };

  const addService = async () => {
    if (!selectedCategory || !selectedSubcategory || !servicePrice) {
      Alert.alert(
        "Error",
        "Please select a category, subcategory and enter a price"
      );
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
        category: selectedCategory.name,
        subcategory: selectedSubcategory,
        name: `${selectedCategory.name} - ${selectedSubcategory}`,
        price: price,
        providerId: currentUser.uid,
        createdAt: new Date(),
      };

      const docRef = await addDoc(
        collection(firestore, "services"),
        newService
      );

      setServicesList([...servicesList, { id: docRef.id, ...newService }]);
      setModalVisible(false);
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      setServicePrice("");

      Alert.alert("Success", "Service added successfully");
    } catch (error) {
      console.error("Error adding service:", error);
      Alert.alert("Error", "Failed to add service");
    }
  };

  const updateService = async () => {
    if (
      !selectedCategory ||
      !selectedSubcategory ||
      !servicePrice ||
      !editingService
    ) {
      Alert.alert("Error", "Please enter all service details");
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
        category: selectedCategory.name,
        subcategory: selectedSubcategory,
        name: `${selectedCategory.name} - ${selectedSubcategory}`,
        price: price,
        updatedAt: new Date(),
      });

      const updatedServices = servicesList.map((service) =>
        service.id === editingService.id
          ? {
              ...service,
              category: selectedCategory.name,
              subcategory: selectedSubcategory,
              name: `${selectedCategory.name} - ${selectedSubcategory}`,
              price,
            }
          : service
      );

      setServicesList(updatedServices);
      setServicePrice("");
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      setEditingService(null);
      setIsEditing(false);
      setModalVisible(false);

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

  const renderCategoryIcon = (category) => {
    return (
      <Ionicons
        name={category.icon}
        size={24}
        color="#333"
        style={styles.categoryIcon}
      />
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

      <TouchableOpacity
        style={styles.addServiceButton}
        onPress={() => setSubcategoryModalVisible(true)}
      >
        <Ionicons name="add-circle-outline" size={24} color="#fff" />
        <Text style={styles.addServiceButtonText}>Add New Service</Text>
      </TouchableOpacity>

      <Text style={styles.listTitle}>Your Services</Text>

      {servicesList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="list-outline" size={64} color="#ccc" />
          <Text style={styles.emptyMessage}>No services added yet</Text>
          <Text style={styles.emptySubtext}>
            Add services to start receiving orders
          </Text>
        </View>
      ) : (
        <FlatList
          data={servicesList}
          keyExtractor={(item) => item.id}
          style={styles.list}
          renderItem={({ item }) => (
            <View style={styles.serviceItem}>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{item.name}</Text>
                <Text style={styles.serviceCategory}>
                  {item.category} - {item.subcategory}
                </Text>
                <Text style={styles.servicePrice}>
                  ${item.price.toFixed(2)}
                </Text>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => startEditing(item)}
                >
                  <Ionicons name="create-outline" size={20} color="#333" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => confirmRemove(item)}
                >
                  <Ionicons name="trash-outline" size={20} color="#f44336" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Category Selection Modal */}
      <Modal
        transparent={true}
        visible={subcategoryModalVisible}
        animationType="slide"
        onRequestClose={() => setSubcategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Service Category</Text>
              <TouchableOpacity
                onPress={() => setSubcategoryModalVisible(false)}
              >
                <Ionicons name="close-outline" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.categoryList}>
              {SERVICE_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryItem}
                  onPress={() => openSubcategoryModal(category)}
                >
                  {renderCategoryIcon(category)}
                  <View style={styles.categoryTextContainer}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.subcategoryCount}>
                      {category.subcategories.length}{" "}
                      {category.subcategories.length === 1
                        ? "option"
                        : "options"}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward-outline"
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Subcategory Selection Modal */}
      <Modal
        transparent={true}
        visible={selectedCategory && subcategoryModalVisible}
        animationType="slide"
        onRequestClose={() => setSubcategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setSubcategoryModalVisible(false)}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back-outline" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {selectedCategory?.name} Services
              </Text>
              <TouchableOpacity
                onPress={() => setSubcategoryModalVisible(false)}
              >
                <Ionicons name="close-outline" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.subcategoryList}>
              {selectedCategory?.subcategories.map((subcategory) => (
                <TouchableOpacity
                  key={subcategory}
                  style={styles.subcategoryItem}
                  onPress={() => selectSubcategory(subcategory)}
                >
                  <Text style={styles.subcategoryName}>{subcategory}</Text>
                  <Ionicons
                    name="chevron-forward-outline"
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Price Input Modal */}
      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? "Update Service" : "Add Service"}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close-outline" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.selectedServiceInfo}>
                <Text style={styles.selectedServiceLabel}>Category:</Text>
                <Text style={styles.selectedServiceValue}>
                  {selectedCategory?.name}
                </Text>
              </View>

              <View style={styles.selectedServiceInfo}>
                <Text style={styles.selectedServiceLabel}>Service Type:</Text>
                <Text style={styles.selectedServiceValue}>
                  {selectedSubcategory}
                </Text>
              </View>

              <Text style={styles.priceLabel}>Enter Price (USD)</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0.00"
                value={servicePrice}
                onChangeText={setServicePrice}
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={styles.saveButton}
                onPress={isEditing ? updateService : addService}
              >
                <Text style={styles.saveButtonText}>
                  {isEditing ? "Update Service" : "Add Service"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
  addServiceButton: {
    flexDirection: "row",
    backgroundColor: "#333333",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  addServiceButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
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
    marginBottom: 4,
  },
  serviceCategory: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 15,
    color: "#333333",
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  removeButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 80,
  },
  emptyMessage: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  modalContent: {
    padding: 20,
  },
  categoryList: {
    paddingHorizontal: 16,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  categoryIcon: {
    marginRight: 16,
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  subcategoryCount: {
    fontSize: 14,
    color: "#666",
  },
  subcategoryList: {
    paddingHorizontal: 16,
  },
  subcategoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  subcategoryName: {
    fontSize: 16,
    color: "#333",
  },
  selectedServiceInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  selectedServiceLabel: {
    fontSize: 16,
    color: "#666",
    width: 100,
  },
  selectedServiceValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    flex: 1,
  },
  priceLabel: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
    marginBottom: 8,
  },
  priceInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: "#333",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default SPServices;
