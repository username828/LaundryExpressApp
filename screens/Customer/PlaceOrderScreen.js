import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Alert,
  StyleSheet,
} from "react-native";
import { addDoc, setDoc, collection, doc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useNavigation } from "@react-navigation/core";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";
import { AddressContext } from "../../context/AddressContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../theme/ThemeContext";

// Import custom components
import Header from "../../components/Header";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";
import CartItem from "../../components/CartItem";
import QuantityControl from "../../components/QuantityControl";

const auth = getAuth();

const PlaceOrderScreen = ({ route }) => {
  const theme = useTheme();
  const navigation = useNavigation();
  const { providerId, availableServices } = route.params;
  const { currentAddress } = useContext(AddressContext);

  // Cart state
  const [cart, setCart] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);

  // Form state
  const [address, setAddress] = useState(currentAddress);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Date and time selection
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState("pickup"); // pickup or dropoff
  const [pickupDate, setPickupDate] = useState(null);
  const [pickupTime, setPickupTime] = useState(null);
  const [dropoffDate, setDropoffDate] = useState(null);
  const [dropoffTime, setDropoffTime] = useState(null);
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

  // Calculate total price when cart changes
  useEffect(() => {
    const total = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    setTotalPrice(total);
  }, [cart]);

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

  // Add item to cart
  const addToCart = (service) => {
    const existingItemIndex = cart.findIndex(
      (item) => item.serviceType === service.name
    );

    if (existingItemIndex !== -1) {
      // Item already in cart, increment quantity
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      // Add new item to cart
      setCart([
        ...cart,
        {
          serviceType: service.name,
          price: service.price,
          quantity: 1,
          subtotal: service.price,
        },
      ]);
    }
  };

  // Update item quantity in cart
  const updateQuantity = (index, newQuantity) => {
    if (newQuantity < 1) {
      // Remove item if quantity is 0
      const updatedCart = cart.filter((_, i) => i !== index);
      setCart(updatedCart);
    } else {
      // Update quantity
      const updatedCart = [...cart];
      updatedCart[index].quantity = newQuantity;
      updatedCart[index].subtotal = updatedCart[index].price * newQuantity;
      setCart(updatedCart);
    }
  };

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
      date.setFullYear(year - 1);
    } else if (month === "Jan" && today.getMonth() === 11) {
      date.setFullYear(year + 1);
    }

    return date;
  };

  // Validate date selection
  const validateDropoffDate = (selectedDate) => {
    if (!pickupDate) return true;

    const pickupDateTime = getDateFromString(pickupDate);
    const dropoffDateTime = getDateFromString(selectedDate);

    if (pickupDateTime && dropoffDateTime) {
      const timeDiff = dropoffDateTime.getTime() - pickupDateTime.getTime();
      return timeDiff >= 86400000; // At least one day difference
    }

    return true;
  };

  // Check if form is valid
  const isFormValid = () => {
    return (
      cart.length > 0 &&
      address &&
      pickupDate &&
      pickupTime &&
      dropoffDate &&
      dropoffTime
    );
  };

  // Handle order placement
  const handlePlaceOrder = async () => {
    if (!isFormValid()) {
      Alert.alert(
        "Incomplete Form",
        "Please fill all required fields before placing an order."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Create a new document reference with an auto-generated ID
      const ordersRef = collection(db, "orders");

      // Prepare order data
      const orderData = {
        customerId: auth.currentUser?.uid,
        serviceProviderId: providerId,
        services: cart.map((item) => ({
          serviceType: item.serviceType,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
        })),
        totalPrice: totalPrice,
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

      // Add document to Firestore
      const orderRef = await addDoc(ordersRef, orderData);

      // Update the document with its ID
      const orderId = orderRef.id;
      await setDoc(orderRef, { orderId }, { merge: true });

      // Navigate to tracking screen with the order details
      navigation.navigate("Track", { orderId, providerId });
    } catch (error) {
      console.error("Error placing order: ", error);
      Alert.alert("Error", "Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modal control functions
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
        setDropoffDate(null);
        setDropoffTime(null);
      }
    }
  }, [pickupDate]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Header
        title="Place Your Order"
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
      />

      <ScrollView>
        {/* Services Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Available Services
          </Text>
          <FlatList
            data={availableServices}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <Card style={styles.serviceCard}>
                <View style={styles.serviceContent}>
                  <FontAwesome5
                    name="tshirt"
                    size={24}
                    color={theme.colors.primary}
                    style={styles.serviceIcon}
                  />
                  <Text
                    style={[styles.serviceText, { color: theme.colors.text }]}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      styles.servicePriceText,
                      { color: theme.colors.secondary },
                    ]}
                  >
                    ${item.price.toFixed(2)}
                  </Text>
                  <Button
                    title="Add to Cart"
                    onPress={() => addToCart(item)}
                    size="small"
                    style={{ marginTop: 10 }}
                  />
                </View>
              </Card>
            )}
          />
        </View>

        {/* Cart Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Your Cart
          </Text>
          {cart.length === 0 ? (
            <Card style={styles.emptyCartCard}>
              <Text
                style={[
                  styles.emptyCartText,
                  { color: theme.colors.textLight },
                ]}
              >
                Your cart is empty. Add services to continue.
              </Text>
            </Card>
          ) : (
            <>
              {cart.map((item, index) => (
                <CartItem
                  key={index}
                  title={item.serviceType}
                  price={item.price}
                  quantity={item.quantity}
                  onUpdateQuantity={(newQuantity) =>
                    updateQuantity(index, newQuantity)
                  }
                />
              ))}

              {/* Order Summary */}
              <Card style={styles.summaryCard}>
                <Text
                  style={[styles.summaryTitle, { color: theme.colors.text }]}
                >
                  Order Summary
                </Text>
                <View style={styles.summaryRow}>
                  <Text style={{ color: theme.colors.textLight }}>
                    Items ({cart.reduce((sum, item) => sum + item.quantity, 0)})
                  </Text>
                  <Text style={{ color: theme.colors.text, fontWeight: "600" }}>
                    ${totalPrice.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.summaryRow}>
                  <Text style={{ color: theme.colors.text, fontWeight: "600" }}>
                    Total
                  </Text>
                  <Text
                    style={{
                      color: theme.colors.primary,
                      fontWeight: "700",
                      fontSize: 18,
                    }}
                  >
                    ${totalPrice.toFixed(2)}
                  </Text>
                </View>
              </Card>
            </>
          )}
        </View>

        {/* Address Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Pickup Address
          </Text>
          <Input
            leftIcon="location-outline"
            placeholder="Enter your address"
            value={address}
            onChangeText={setAddress}
          />
        </View>

        {/* Pickup Date & Time */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            1. Pickup Date & Time{" "}
            <Text style={{ color: theme.colors.error }}>*</Text>
          </Text>
          <TouchableOpacity
            style={[
              styles.timeSelector,
              { backgroundColor: theme.colors.card },
            ]}
            onPress={openPickupModal}
          >
            <FontAwesome5
              name="calendar-alt"
              size={18}
              color={theme.colors.primary}
            />
            <Text
              style={[styles.timeSelectorText, { color: theme.colors.text }]}
            >
              {pickupDate && pickupTime
                ? `${pickupDate}, ${pickupTime}`
                : "Select Pickup Date & Time"}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.textLight}
            />
          </TouchableOpacity>
        </View>

        {/* Dropoff Date & Time */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            2. Drop-off Date & Time{" "}
            <Text style={{ color: theme.colors.error }}>*</Text>
          </Text>
          <TouchableOpacity
            style={[
              styles.timeSelector,
              { backgroundColor: theme.colors.card },
              !pickupDate && !pickupTime && { opacity: 0.6 },
            ]}
            onPress={openDropoffModal}
            disabled={!pickupDate || !pickupTime}
          >
            <FontAwesome5
              name="calendar-alt"
              size={18}
              color={
                pickupDate && pickupTime
                  ? theme.colors.primary
                  : theme.colors.textLight
              }
            />
            <Text
              style={[
                styles.timeSelectorText,
                {
                  color:
                    pickupDate && pickupTime
                      ? theme.colors.text
                      : theme.colors.textLight,
                },
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
              color={
                pickupDate && pickupTime
                  ? theme.colors.textLight
                  : theme.colors.textLight
              }
            />
          </TouchableOpacity>
          {pickupDate && pickupTime && (
            <Text
              style={[styles.helperText, { color: theme.colors.textLight }]}
            >
              Drop-off must be scheduled at least one day after pickup
            </Text>
          )}
        </View>

        {/* Place Order Button */}
        <Button
          title="Place Order"
          icon="cart"
          onPress={handlePlaceOrder}
          loading={isSubmitting}
          disabled={!isFormValid() || isSubmitting}
          style={styles.placeOrderButton}
        />
      </ScrollView>

      {/* Date & Time Picker Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.card },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Choose {modalType === "pickup" ? "Pickup" : "Drop-off"} Date &
                Time
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={theme.colors.textLight}
                />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: theme.colors.text }]}>
              Select a Date
            </Text>
            {modalType === "dropoff" && pickupDate && (
              <Text
                style={[
                  styles.modalInstructions,
                  { color: theme.colors.textLight },
                ]}
              >
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
                const isValidDropoffDate =
                  modalType === "pickup" || validateDropoffDate(item.date);
                const isSelected =
                  modalType === "pickup"
                    ? pickupDate === item.date
                    : dropoffDate === item.date;

                return (
                  <TouchableOpacity
                    style={[
                      styles.dateCard,
                      { backgroundColor: theme.colors.background },
                      isSelected && { backgroundColor: theme.colors.primary },
                      !isValidDropoffDate && { opacity: 0.5 },
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
                        { color: theme.colors.textLight },
                        isSelected && { color: theme.colors.white },
                      ]}
                    >
                      {item.day}
                    </Text>
                    <Text
                      style={[
                        styles.dateText,
                        { color: theme.colors.text },
                        isSelected && { color: theme.colors.white },
                      ]}
                    >
                      {item.date}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />

            <Text style={[styles.modalSubtitle, { color: theme.colors.text }]}>
              Select a Time
            </Text>
            <FlatList
              data={timeSlots}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected =
                  modalType === "pickup"
                    ? pickupTime === item
                    : dropoffTime === item;

                return (
                  <TouchableOpacity
                    style={[
                      styles.timeCard,
                      { backgroundColor: theme.colors.background },
                      isSelected && { backgroundColor: theme.colors.primary },
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
                        isSelected ? theme.colors.white : theme.colors.primary
                      }
                      style={styles.timeIcon}
                    />
                    <Text
                      style={[
                        styles.timeText,
                        { color: theme.colors.text },
                        isSelected && { color: theme.colors.white },
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />

            <Button
              title="Confirm"
              onPress={confirmDateTime}
              style={styles.confirmButton}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  serviceCard: {
    width: 160,
    marginRight: 12,
    padding: 0,
    overflow: "hidden",
  },
  serviceContent: {
    alignItems: "center",
    padding: 16,
  },
  serviceIcon: {
    marginBottom: 8,
  },
  serviceText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "center",
  },
  servicePriceText: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyCartCard: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCartText: {
    fontSize: 14,
    textAlign: "center",
  },
  summaryCard: {
    marginTop: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 12,
  },
  timeSelector: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
  },
  timeSelectorText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    marginTop: 6,
    fontStyle: "italic",
  },
  placeOrderButton: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
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
  },
  closeButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 16,
  },
  dateCard: {
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    alignItems: "center",
    minWidth: 100,
  },
  dateDay: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
  },
  timeCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 160,
  },
  timeIcon: {
    marginRight: 8,
  },
  timeText: {
    fontSize: 14,
  },
  confirmButton: {
    marginTop: 24,
  },
  modalInstructions: {
    fontSize: 13,
    marginBottom: 10,
    fontStyle: "italic",
    textAlign: "center",
  },
});

export default PlaceOrderScreen;
