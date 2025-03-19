import React, { useState, useContext } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { doc, setDoc, collection } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useNavigation } from "@react-navigation/core";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";
import { AddressContext } from "../../context/AddressContext";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const auth = getAuth(); // Initialize Firebase Auth

const PlaceOrderScreen = ({ route }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { providerId, availableServices } = route.params;

  const [serviceType, setServiceType] = useState("");
  const [price, setPrice] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { currentAddress } = useContext(AddressContext);
  const [address, setAddress] = useState(currentAddress);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  // Sample data for dates and times
  const dates = [
    { id: "1", day: "Tomorrow", date: "Oct 05" },
    { id: "2", day: "Sunday", date: "Oct 06" },
    { id: "3", day: "Monday", date: "Oct 07" },
    { id: "4", day: "Tuesday", date: "Oct 08" },
    { id: "5", day: "Wednesday", date: "Oct 09" },
    { id: "6", day: "Thursday", date: "Oct 10" },
  ];

  const timeSlots = [
    "08:00 AM - 09:00 AM",
    "09:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
    "11:00 AM - 12:00 PM",
    "02:00 PM - 03:00 PM",
    "03:00 PM - 04:00 PM",
  ];

  const handlePlaceOrder = async () => {
    if (!serviceType || !address || !selectedDate || !selectedTime) {
      alert("Please fill all fields before placing an order.");
      return;
    }

    setIsSubmitting(true);

    try {
      const orderRef = doc(collection(db, "orders"));
      const orderId = orderRef.id;
      const orderData = {
        orderId,
        customerId: auth.currentUser?.uid,
        serviceProviderId: providerId,
        serviceType: serviceType,
        price: price,
        address: address,
        status: "Order Placed",
        orderTime: `${selectedDate} ${selectedTime}`,
        createdAt: new Date().toISOString(),
      };

      console.log("Order placed: ", orderData);
      await setDoc(orderRef, orderData);
      navigation.navigate("Track", { orderId, providerId });
    } catch (error) {
      console.error("Error placing order: ", error);
      alert("Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={[styles.header, { marginTop: insets.top > 0 ? 0 : 20 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Place Your Order</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Service</Text>
          <FlatList
            data={availableServices}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.serviceCard,
                  serviceType === item.name && styles.selectedService,
                ]}
                onPress={() => {
                  setServiceType(item.name);
                  setPrice(item.price);
                }}
              >
                <FontAwesome5
                  name="tshirt"
                  size={24}
                  color={serviceType === item.name ? "#FFFFFF" : "#007AFF"}
                  style={styles.serviceIcon}
                />
                <Text
                  style={[
                    styles.serviceText,
                    serviceType === item.name && styles.selectedServiceText,
                  ]}
                >
                  {item.name}
                </Text>
                <Text
                  style={[
                    styles.servicePriceText,
                    serviceType === item.name && styles.selectedServiceText,
                  ]}
                >
                  ${item.price.toFixed(2)}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estimated Price</Text>
          <View style={styles.priceContainer}>
            <FontAwesome5 name="money-bill-wave" size={20} color="#34C759" />
            <Text style={styles.price}>${price.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup Address</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="location-outline" size={20} color="#555" />
            <TextInput
              style={styles.input}
              placeholder="Enter your address"
              value={address}
              onChangeText={setAddress}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Time</Text>
          <TouchableOpacity
            style={styles.selectTimeButton}
            onPress={() => setModalVisible(true)}
          >
            <FontAwesome5 name="calendar-alt" size={18} color="#007AFF" />
            <Text style={styles.selectTimeText}>
              {selectedDate && selectedTime
                ? `${selectedDate}, ${selectedTime}`
                : "Pick a Date & Time"}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.placeOrderButton,
            (!serviceType || !address || !selectedDate || !selectedTime) &&
              styles.disabledButton,
            isSubmitting && styles.loadingButton,
          ]}
          onPress={handlePlaceOrder}
          disabled={
            !serviceType ||
            !address ||
            !selectedDate ||
            !selectedTime ||
            isSubmitting
          }
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <FontAwesome5 name="shopping-cart" size={18} color="#fff" />
              <Text style={styles.placeOrderText}> Place Order</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Date & Time Picker Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Date & Time</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Select a Date</Text>
            <FlatList
              data={dates}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dateCard,
                    selectedDate === item.date && styles.dateCardSelected,
                  ]}
                  onPress={() => setSelectedDate(item.date)}
                >
                  <Text
                    style={[
                      styles.dateDay,
                      selectedDate === item.date && styles.dateTextSelected,
                    ]}
                  >
                    {item.day}
                  </Text>
                  <Text
                    style={[
                      styles.dateText,
                      selectedDate === item.date && styles.dateTextSelected,
                    ]}
                  >
                    {item.date}
                  </Text>
                </TouchableOpacity>
              )}
            />

            <Text style={styles.modalSubtitle}>Select a Time</Text>
            <FlatList
              data={timeSlots}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.timeCard,
                    selectedTime === item && styles.timeCardSelected,
                  ]}
                  onPress={() => setSelectedTime(item)}
                >
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={selectedTime === item ? "#FFFFFF" : "#007AFF"}
                    style={styles.timeIcon}
                  />
                  <Text
                    style={[
                      styles.timeText,
                      selectedTime === item && styles.timeTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.doneButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3C3C43",
    marginBottom: 12,
  },
  serviceCard: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginRight: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 120,
  },
  selectedService: {
    backgroundColor: "#007AFF",
  },
  serviceIcon: {
    marginBottom: 8,
  },
  serviceText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  servicePriceText: {
    fontSize: 14,
    color: "#8E8E93",
  },
  selectedServiceText: {
    color: "#FFFFFF",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  price: {
    fontSize: 20,
    fontWeight: "600",
    color: "#34C759",
    marginLeft: 12,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#3C3C43",
  },
  selectTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectTimeText: {
    flex: 1,
    fontSize: 16,
    color: "#3C3C43",
    marginLeft: 12,
  },
  placeOrderButton: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: "#A2A2A2",
    shadowColor: "#A2A2A2",
  },
  loadingButton: {
    backgroundColor: "#007AFF",
  },
  placeOrderText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  closeButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3C3C43",
    marginBottom: 12,
    marginTop: 16,
  },
  dateCard: {
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    minWidth: 100,
  },
  dateCardSelected: {
    backgroundColor: "#007AFF",
  },
  dateDay: {
    fontSize: 14,
    fontWeight: "500",
    color: "#3C3C43",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3C3C43",
  },
  dateTextSelected: {
    color: "#FFFFFF",
  },
  timeCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    backgroundColor: "#F2F2F7",
    minWidth: 160,
  },
  timeCardSelected: {
    backgroundColor: "#007AFF",
  },
  timeIcon: {
    marginRight: 8,
  },
  timeText: {
    fontSize: 14,
    color: "#3C3C43",
  },
  timeTextSelected: {
    color: "#FFFFFF",
  },
  doneButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
  },
  doneButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default PlaceOrderScreen;