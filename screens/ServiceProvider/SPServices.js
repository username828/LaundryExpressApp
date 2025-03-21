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
  StatusBar,
  SafeAreaView,
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
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../theme/ThemeContext";

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
  const theme = useTheme();

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
      <View
        style={[
          styles.categoryIconContainer,
          { backgroundColor: theme.colors.primary + "15" },
        ]}
      >
        <Ionicons
          name={category.icon}
          size={24}
          color={theme.colors.primary}
          style={styles.categoryIcon}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading services...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Manage Services</Text>
          <Text style={styles.headerSubtitle}>
            Add and customize your service offerings
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.contentContainer}>
        <TouchableOpacity
          style={[
            styles.addServiceButton,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => setSubcategoryModalVisible(true)}
        >
          <Ionicons name="add-circle-outline" size={22} color="#fff" />
          <Text style={styles.addServiceButtonText}>Add New Service</Text>
        </TouchableOpacity>

        <Text style={styles.listTitle}>Your Services</Text>

        {servicesList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: theme.colors.primary + "15" },
              ]}
            >
              <Ionicons
                name="list-outline"
                size={50}
                color={theme.colors.primary}
              />
            </View>
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
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.serviceItem}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{item.name}</Text>
                  <Text style={styles.serviceCategory}>
                    {item.category} - {item.subcategory}
                  </Text>
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Price:</Text>
                    <Text style={styles.servicePrice}>
                      ${item.price.toFixed(2)}
                    </Text>
                  </View>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[
                      styles.editButton,
                      { backgroundColor: theme.colors.primary + "10" },
                    ]}
                    onPress={() => startEditing(item)}
                  >
                    <Ionicons
                      name="create-outline"
                      size={20}
                      color={theme.colors.primary}
                    />
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
      </View>

      {/* Category Selection Modal */}
      <Modal
        transparent={true}
        visible={subcategoryModalVisible && !selectedCategory}
        animationType="slide"
        onRequestClose={() => setSubcategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryDark]}
              style={styles.modalGradientHeader}
            >
              <Text style={styles.modalGradientTitle}>
                Select Service Category
              </Text>
              <TouchableOpacity
                onPress={() => setSubcategoryModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close-outline" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>

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
                    color={theme.colors.textLight}
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
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryDark]}
              style={styles.modalGradientHeader}
            >
              <TouchableOpacity
                onPress={() => setSelectedCategory(null)}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.modalGradientTitle}>
                {selectedCategory?.name} Services
              </Text>
              <TouchableOpacity
                onPress={() => setSubcategoryModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close-outline" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>

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
                    color={theme.colors.textLight}
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
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryDark]}
              style={styles.modalGradientHeader}
            >
              <Text style={styles.modalGradientTitle}>
                {isEditing ? "Update Service" : "Add Service"}
              </Text>
              <TouchableOpacity
                onPress={closeModal}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close-outline" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>

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

              <Text style={styles.priceInputLabel}>Enter Price (USD)</Text>
              <View style={styles.priceInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="0.00"
                  value={servicePrice}
                  onChangeText={setServicePrice}
                  keyboardType="numeric"
                  placeholderTextColor={theme.colors.textLight}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={isEditing ? updateService : addService}
              >
                <Ionicons
                  name={isEditing ? "save-outline" : "add-circle-outline"}
                  size={20}
                  color="#FFFFFF"
                  style={styles.saveButtonIcon}
                />
                <Text style={styles.saveButtonText}>
                  {isEditing ? "Update Service" : "Add Service"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
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
  addServiceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addServiceButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#333333",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
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
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f0f0f0",
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
    marginBottom: 6,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 14,
    color: "#666666",
    marginRight: 4,
  },
  servicePrice: {
    fontSize: 16,
    color: "#333333",
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
  },
  removeButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 60,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyMessage: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#777",
    marginTop: 8,
    textAlign: "center",
    maxWidth: "80%",
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
    overflow: "hidden",
    maxHeight: "85%",
  },
  modalGradientHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalGradientTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
  },
  modalCloseButton: {
    padding: 4,
  },
  backButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  categoryList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  categoryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  subcategoryCount: {
    fontSize: 13,
    color: "#666",
  },
  subcategoryList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    fontSize: 15,
    color: "#666",
    width: 100,
  },
  selectedServiceValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    flex: 1,
  },
  priceInputLabel: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
    marginBottom: 10,
    marginTop: 8,
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    marginBottom: 24,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: "#F9F9F9",
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    fontSize: 18,
    color: "#333",
    height: 56,
  },
  saveButton: {
    flexDirection: "row",
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default SPServices;
