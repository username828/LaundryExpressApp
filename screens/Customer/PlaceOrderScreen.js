import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { doc, setDoc, collection } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useNavigation } from "@react-navigation/core";
import { Ionicons } from "@expo/vector-icons";
import { FontAwesome5 } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";
import { AddressContext } from "../../context/AddressContext";

import { useContext } from "react";

const auth = getAuth(); // Initialize Firebase Auth

const PlaceOrderScreen = ({ route }) => {
  const navigation = useNavigation();
  const { providerId, availableServices } = route.params;
  console.log(providerId, availableServices);
  const [serviceType, setServiceType] = useState("");
  const [price, setPrice] = useState(0);

  const {currentAddress} = useContext(AddressContext);
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

    try {
      const orderRef = doc(collection(db, "orders"));
      const orderId = orderRef.id;
      const orderData = {
        orderId,
        customerId: auth.currentUser?.uid, 
        serviceProviderId: providerId,
        serviceType: serviceType,
        price: price,
        address:address,
        status: "Pending",
        orderTime: `${selectedDate} ${selectedTime}`,
        createdAt: new Date().toISOString(),
      };
      //console.log(orderData)
      await setDoc(orderRef, orderData);
      alert("Order placed successfully!");
      navigation.navigate('Track', { orderId,providerId });
    } catch (error) {
      console.error("Error placing order: ", error);
      alert("Failed to place order. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧺 Place Your Order</Text>

      <Text style={styles.label}>Select Service</Text>
      <FlatList
        data={availableServices}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.serviceCard,
              serviceType === item ? styles.selectedService : null,
            ]}
            onPress={() => {
              setServiceType(item.name);
              setPrice(item.price);
            }}
          >
            <Text
              style={[
                styles.serviceText,
                serviceType === item.name ? styles.selectedServiceText : null,
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Estimated Price */}
      <Text style={styles.label}>Estimated Price</Text>
      <View style={styles.priceContainer}>
        <FontAwesome5 name="money-bill-wave" size={20} color="#4CAF50" />
        <Text style={styles.price}>${price}</Text>
      </View>

      <Text style={styles.label}>Pickup Address</Text>
      <View style={styles.inputContainer}>
        <Ionicons name="location-outline" size={20} color="#555" />
        <TextInput
          style={styles.input}
          placeholder={currentAddress}
          value={address}
          onChangeText={setAddress}
        />
      </View>

      <Text style={styles.label}>Order Time</Text>
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
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.placeOrderButton}
        onPress={handlePlaceOrder}
      >
        <FontAwesome5 name="shopping-cart" size={18} color="#fff" />
        <Text style={styles.placeOrderText}> Place Order</Text>
      </TouchableOpacity>

      {/* Date & Time Picker Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Date & Time</Text>

            <Text style={styles.modalSubtitle}>Select a Date</Text>
            <FlatList
              data={dates}
              keyExtractor={(item) => item.id}
              horizontal
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dateCard,
                    selectedDate === item.date && styles.dateCardSelected,
                  ]}
                  onPress={() => setSelectedDate(item.date)}
                >
                  <Text style={styles.dateText}>{item.day}</Text>
                  <Text style={styles.dateText}>{item.date}</Text>
                </TouchableOpacity>
              )}
            />

            <Text style={styles.modalSubtitle}>Select a Time</Text>
            <FlatList
              data={timeSlots}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.timeCard,
                    selectedTime === item && styles.timeCardSelected,
                  ]}
                  onPress={() => setSelectedTime(item)}
                >
                  <Text style={styles.timeText}>{item}</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: "#fff",
    marginTop: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  serviceCard: {
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    backgroundColor: "#f8f8f8",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedService: {

    backgroundColor: "#007bff",
    borderColor: "#0056b3",
  },
  serviceText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  selectedServiceText: {
    color: "black",
    fontWeight: "bold",
  },
  label: {
    fontSize: 20,
    fontWeight: "500",
    marginBottom: 8,
    color: "#555",
    textAlign: "center",
  },
  picker: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 8,
    height: 50,
    justifyContent: "center",
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderColor: "#ddd",
    borderWidth: 1,
    height: 50,
    paddingHorizontal: 10,
    marginBottom: 16,
    color: "#333",
  },
  selectTimeButton: {
    backgroundColor: "#eef",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  selectTimeText: {
    color: "#333",
    fontSize: 16,
  },
  placeOrderButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  placeOrderText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "90%",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
  },
  dateCard: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    margin: 5,
    borderRadius: 8,
    alignItems: "center",
  },
  dateCardSelected: {
    backgroundColor: "#007AFF",
  },
  dateText: {
    color: "#333",
  },
  timeCard: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    margin: 5,
    borderRadius: 8,
    alignItems: "center",
  },
  timeCardSelected: {
    backgroundColor: "#007AFF",
  },
  timeText: {
    color: "#333",
  },
  doneButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    marginTop: 20,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
  },
  doneButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default PlaceOrderScreen;
