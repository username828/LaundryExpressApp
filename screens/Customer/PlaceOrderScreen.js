import React, { useState, useContext, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Alert,
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
  const [modalType, setModalType] = useState("pickup"); // pickup or dropoff

  // Separate pickup and dropoff date/time
  const [pickupDate, setPickupDate] = useState(null);
  const [pickupTime, setPickupTime] = useState(null);
  const [dropoffDate, setDropoffDate] = useState(null);
  const [dropoffTime, setDropoffTime] = useState(null);

  // Generate dynamic dates for a week
  const [dates, setDates] = useState([]);

  // Time slots
  const timeSlots = [
    "08:00 AM - 09:00 AM",
    "09:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
    "11:00 AM - 12:00 PM",
    "02:00 PM - 03:00 PM",
    "03:00 PM - 04:00 PM",
  ];

  // Generate dates for a week starting from tomorrow
  useEffect(() => {
    const generateDates = () => {
      const daysOfWeek = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      const dates = [];
      const today = new Date();

      for (let i = 1; i <= 7; i++) {
        const date = new Date();
        date.setDate(today.getDate() + i);

        const dayName = i === 1 ? "Tomorrow" : daysOfWeek[date.getDay()];
        const formattedDate = `${months[date.getMonth()]} ${date.getDate()}`;

        dates.push({
          id: i.toString(),
          day: dayName,
          date: formattedDate,
        });
      }

      setDates(dates);
    };

    generateDates();
  }, []);

  // Convert date string to Date object for comparison
  const getDateFromString = (dateString) => {
    if (!dateString) return null;

    const monthsMap = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };

    const [month, day] = dateString.split(" ");
    const today = new Date();
    const year = today.getFullYear();
    const date = new Date(year, monthsMap[month], parseInt(day));

    // Handle year rollover for future dates
    if (month === "Dec" && today.getMonth() === 0) {
      // if it's January but we see December dates
      date.setFullYear(year - 1);
    } else if (month === "Jan" && today.getMonth() === 11) {
      // if it's December but we see January dates
      date.setFullYear(year + 1);
    }

    return date;
  };

  // Validate date selection
  const validateDropoffDate = (selectedDate) => {
    if (!pickupDate) return true; // No pickup date set yet

    const pickupDateTime = getDateFromString(pickupDate);
    const dropoffDateTime = getDateFromString(selectedDate);

    // Ensure dropoff is at least 1 day after pickup
    if (pickupDateTime && dropoffDateTime) {
      // Compare by counting milliseconds difference
      // A full day is 86400000 milliseconds
      const timeDiff = dropoffDateTime.getTime() - pickupDateTime.getTime();
      return timeDiff >= 86400000; // At least one day difference
    }

    return true;
  };

  // For UI updates
  const isFormValid = () => {
    return (
      serviceType &&
      address &&
      pickupDate &&
      pickupTime &&
      dropoffDate &&
      dropoffTime
    );
  };

  const handlePlaceOrder = async () => {
    if (
      !serviceType ||
      !address ||
      !pickupDate ||
      !pickupTime ||
      !dropoffDate ||
      !dropoffTime
    ) {
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
        orderPickup: {
          date: pickupDate,
          time: pickupTime,
        },
        orderDropoff: {
          date: dropoffDate,
          time: dropoffTime,
        },
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

  const openPickupModal = () => {
    setModalType("pickup");
    setModalVisible(true);
  };

  const openDropoffModal = () => {
    if (!pickupDate || !pickupTime) {
      Alert.alert(
        "Pickup Time Required",
        "Please select a pickup date and time first before scheduling the drop-off."
      );
      return;
    }
    setModalType("dropoff");
    setModalVisible(true);
  };

  const confirmDateTime = () => {
    // For dropoff, check if the selected date is valid
    if (modalType === "dropoff" && !validateDropoffDate(dropoffDate)) {
      Alert.alert(
        "Invalid Drop-off Date",
        "Drop-off date must be at least one day after pickup date."
      );
      return;
    }

    setModalVisible(false);
  };

  // Update dropoff date if pickup date changes and makes current dropoff invalid
  useEffect(() => {
    if (pickupDate && dropoffDate) {
      if (!validateDropoffDate(dropoffDate)) {
        // Reset dropoff selections if they're invalid
        setDropoffDate(null);
        setDropoffTime(null);
      }
    }
  }, [pickupDate]);

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

      <ScrollView style={styles.content}>
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
          <Text style={styles.sectionTitle}>
            1. Pickup Date & Time <Text style={styles.requiredText}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.selectTimeButton}
            onPress={openPickupModal}
          >
            <FontAwesome5 name="calendar-alt" size={18} color="#007AFF" />
            <Text style={styles.selectTimeText}>
              {pickupDate && pickupTime
                ? `${pickupDate}, ${pickupTime}`
                : "Select Pickup Date & Time"}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            2. Drop-off Date & Time <Text style={styles.requiredText}>*</Text>
          </Text>
          <TouchableOpacity
            style={[
              styles.selectTimeButton,
              !pickupDate && !pickupTime && styles.disabledButton,
            ]}
            onPress={openDropoffModal}
          >
            <FontAwesome5
              name="calendar-alt"
              size={18}
              color={pickupDate && pickupTime ? "#007AFF" : "#A2A2A2"}
            />
            <Text
              style={[
                styles.selectTimeText,
                !pickupDate && !pickupTime && { color: "#A2A2A2" },
              ]}
            >
              {dropoffDate && dropoffTime
                ? `${dropoffDate}, ${dropoffTime}`
                : pickupDate && pickupTime
                ? "Select Drop-off Date & Time"
                : "Complete pickup selection first"}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={pickupDate && pickupTime ? "#8E8E93" : "#A2A2A2"}
            />
          </TouchableOpacity>
          {pickupDate && pickupTime && (
            <Text style={styles.helperText}>
              Drop-off must be scheduled at least one day after pickup
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.placeOrderButton,
            !isFormValid() && styles.disabledButton,
            isSubmitting && styles.loadingButton,
          ]}
          onPress={handlePlaceOrder}
          disabled={!isFormValid() || isSubmitting}
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
      </ScrollView>

      {/* Date & Time Picker Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Choose {modalType === "pickup" ? "Pickup" : "Drop-off"} Date &
                Time
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Select a Date</Text>
            {modalType === "dropoff" && pickupDate && (
              <Text style={styles.modalInstructions}>
                Please select a date that is at least one day after your pickup
                date ({pickupDate})
              </Text>
            )}
            <FlatList
              data={dates}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => {
                // For dropoff, check if the date is valid (at least 1 day after pickup)
                const isValidDropoffDate =
                  modalType === "pickup" || validateDropoffDate(item.date);

                return (
                  <TouchableOpacity
                    style={[
                      styles.dateCard,
                      (modalType === "pickup"
                        ? pickupDate === item.date
                        : dropoffDate === item.date) && styles.dateCardSelected,
                      !isValidDropoffDate && styles.disabledDateCard,
                    ]}
                    onPress={() => {
                      if (modalType === "pickup") {
                        setPickupDate(item.date);
                      } else if (isValidDropoffDate) {
                        setDropoffDate(item.date);
                      } else {
                        Alert.alert(
                          "Invalid Selection",
                          `Drop-off date must be at least one day after pickup date (${pickupDate}).`
                        );
                      }
                    }}
                    disabled={!isValidDropoffDate && modalType === "dropoff"}
                  >
                    <Text
                      style={[
                        styles.dateDay,
                        (modalType === "pickup"
                          ? pickupDate === item.date
                          : dropoffDate === item.date) &&
                          styles.dateTextSelected,
                        !isValidDropoffDate && styles.disabledDateText,
                      ]}
                    >
                      {item.day}
                    </Text>
                    <Text
                      style={[
                        styles.dateText,
                        (modalType === "pickup"
                          ? pickupDate === item.date
                          : dropoffDate === item.date) &&
                          styles.dateTextSelected,
                        !isValidDropoffDate && styles.disabledDateText,
                      ]}
                    >
                      {item.date}
                    </Text>
                  </TouchableOpacity>
                );
              }}
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
                    (modalType === "pickup"
                      ? pickupTime === item
                      : dropoffTime === item) && styles.timeCardSelected,
                  ]}
                  onPress={() => {
                    if (modalType === "pickup") {
                      setPickupTime(item);
                    } else {
                      setDropoffTime(item);
                    }
                  }}
                >
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={
                      (
                        modalType === "pickup"
                          ? pickupTime === item
                          : dropoffTime === item
                      )
                        ? "#FFFFFF"
                        : "#007AFF"
                    }
                    style={styles.timeIcon}
                  />
                  <Text
                    style={[
                      styles.timeText,
                      (modalType === "pickup"
                        ? pickupTime === item
                        : dropoffTime === item) && styles.timeTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={styles.doneButton}
              onPress={confirmDateTime}
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
  disabledDateCard: {
    backgroundColor: "#F2F2F7",
    opacity: 0.5,
  },
  disabledDateText: {
    color: "#8E8E93",
    opacity: 0.5,
  },
  requiredText: {
    color: "#FF3B30",
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 6,
    fontStyle: "italic",
  },
  modalInstructions: {
    fontSize: 13,
    color: "#8E8E93",
    marginBottom: 10,
    fontStyle: "italic",
    textAlign: "center",
  },
});

export default PlaceOrderScreen;
