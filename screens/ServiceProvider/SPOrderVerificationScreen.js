import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { firestore as db } from "../../firebaseConfig";
import { useTheme } from "../../theme/ThemeContext";
import Header from "../../components/Header";
import Card from "../../components/Card";
import Button from "../../components/Button";

const SPOrderVerificationScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId, verificationStage } = route.params; // verificationStage can be 'pickup' or 'dropoff'

  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [itemsList, setItemsList] = useState([]);
  const [spId, setSpId] = useState(""); // Service Provider ID

  // Load order data and initialize verification items
  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const orderRef = doc(db, "orders", orderId);
        const orderSnap = await getDoc(orderRef);

        if (orderSnap.exists()) {
          const data = orderSnap.data();
          setOrderData(data);

          // Get SP ID from order or user authentication
          setSpId(data.serviceProviderId || "");

          // Extract items from the services array in the order
          if (data.services && Array.isArray(data.services)) {
            const items = data.services.map((service, index) => ({
              id: index.toString(),
              serviceType: service.serviceType,
              quantity: service.quantity || 1,
              price: service.price || 0,
              verified: false,
              missing: false,
              notes: "",
            }));
            setItemsList(items);
          }
        } else {
          Alert.alert("Error", "Order not found");
          navigation.goBack();
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching order:", error);
        Alert.alert("Error", "Failed to load order details");
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [orderId, navigation]);

  // Toggle the verification status of an item
  const toggleItemVerification = (itemId) => {
    setItemsList(
      itemsList.map((item) => {
        if (item.id === itemId) {
          // If marking as verified, also clear 'missing' flag
          return {
            ...item,
            verified: !item.verified,
            missing: item.missing && !item.verified,
          };
        }
        return item;
      })
    );
  };

  // Toggle the missing status of an item
  const toggleItemMissing = (itemId) => {
    setItemsList(
      itemsList.map((item) => {
        if (item.id === itemId) {
          // If marking as missing, also clear 'verified' flag
          return {
            ...item,
            missing: !item.missing,
            verified: item.verified && !item.missing,
          };
        }
        return item;
      })
    );
  };

  // Update notes for an item
  const updateItemNotes = (itemId, notes) => {
    setItemsList(
      itemsList.map((item) => {
        if (item.id === itemId) {
          return { ...item, notes };
        }
        return item;
      })
    );
  };

  // Submit verification results
  const handleSubmitVerification = async () => {
    try {
      // Check if all items have been processed (either verified or marked as missing)
      const unprocessedItems = itemsList.filter(
        (item) => !item.verified && !item.missing
      );

      if (unprocessedItems.length > 0) {
        Alert.alert(
          "Incomplete Verification",
          "Some items have not been verified or marked as missing. Do you want to continue?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Continue", onPress: submitVerification },
          ]
        );
      } else {
        submitVerification();
      }
    } catch (error) {
      console.error("Error in verification:", error);
      Alert.alert("Error", "Failed to submit verification");
    }
  };

  // Actual verification submission
  const submitVerification = async () => {
    try {
      setLoading(true);

      const timestamp = new Date().toISOString();
      const orderRef = doc(db, "orders", orderId);

      // Prepare verification data
      const verificationData = {
        items: itemsList.map((item) => ({
          serviceType: item.serviceType,
          verified: item.verified,
          missing: item.missing,
          notes: item.notes,
        })),
        timestamp,
        serviceProviderId: spId,
      };

      // Field to update depends on verification stage
      let updateField = {};

      if (verificationStage === "pickup") {
        updateField = {
          pickupVerification: verificationData,
          pickedUpAt: timestamp, // Update pickup timestamp
          status: "Picked Up",
        };
      } else {
        updateField = {
          dropoffVerification: verificationData,
          // If all items are delivered, update the delivered timestamp and status
          ...(itemsList.every((item) => item.verified)
            ? {
                deliveredAt: timestamp,
                status: "Delivered",
              }
            : {}),
        };
      }

      // Update order document
      await updateDoc(orderRef, updateField);

      setLoading(false);

      Alert.alert(
        "Verification Complete",
        `Order items have been ${
          verificationStage === "pickup" ? "picked up" : "delivered"
        } successfully`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error("Error submitting verification:", error);
      setLoading(false);
      Alert.alert("Error", "Failed to submit verification");
    }
  };

  // Render each item in the list
  const renderItem = ({ item }) => (
    <Card style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemName}>{item.serviceType}</Text>
        <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
      </View>

      <View style={styles.verificationActions}>
        <TouchableOpacity
          style={[styles.actionButton, item.verified && styles.verifiedButton]}
          onPress={() => toggleItemVerification(item.id)}
        >
          <Ionicons
            name={
              item.verified ? "checkmark-circle" : "checkmark-circle-outline"
            }
            size={24}
            color={item.verified ? "white" : theme.colors.text}
          />
          <Text
            style={[styles.actionText, item.verified && styles.verifiedText]}
          >
            Verified
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, item.missing && styles.missingButton]}
          onPress={() => toggleItemMissing(item.id)}
        >
          <Ionicons
            name={item.missing ? "close-circle" : "close-circle-outline"}
            size={24}
            color={item.missing ? "white" : theme.colors.text}
          />
          <Text style={[styles.actionText, item.missing && styles.missingText]}>
            Missing
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.notesInput}
        placeholder="Add notes (e.g., condition, damage, stains)"
        value={item.notes}
        onChangeText={(text) => updateItemNotes(item.id, text)}
        multiline
      />
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title={`${
            verificationStage === "pickup" ? "Pickup" : "Dropoff"
          } Verification`}
          leftIcon="arrow-back"
          onLeftPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={`${
          verificationStage === "pickup" ? "Pickup" : "Dropoff"
        } Verification`}
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.contentContainer}>
            <View style={styles.orderInfo}>
              <Text style={styles.orderTitle}>
                Order #{orderId.substring(0, 8)}
              </Text>
              <Text style={styles.orderSubtitle}>
                {verificationStage === "pickup"
                  ? "Picking up items from customer"
                  : "Delivering items to customer"}
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Items List</Text>
            <Text style={styles.sectionSubtitle}>
              Verify each item by marking as present or missing
            </Text>

            {itemsList.length === 0 ? (
              <Text style={styles.emptyListText}>
                No items found in this order
              </Text>
            ) : (
              <FlatList
                data={itemsList}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                style={styles.itemsList}
              />
            )}

            <View style={styles.summary}>
              <Text style={styles.summaryText}>
                {itemsList.filter((item) => item.verified).length} of{" "}
                {itemsList.length} items verified
              </Text>
              <Text style={styles.summaryText}>
                {itemsList.filter((item) => item.missing).length} of{" "}
                {itemsList.length} items missing
              </Text>
            </View>

            <Button
              title={`Complete ${
                verificationStage === "pickup" ? "Pickup" : "Delivery"
              }`}
              onPress={handleSubmitVerification}
              style={styles.submitButton}
              disabled={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  orderInfo: {
    marginBottom: 24,
  },
  orderTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2D3748",
    marginBottom: 4,
  },
  orderSubtitle: {
    fontSize: 16,
    color: "#718096",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2D3748",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#718096",
    marginBottom: 16,
  },
  itemsList: {
    marginBottom: 16,
  },
  itemCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2D3748",
    flex: 1,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: "500",
    color: "#718096",
  },
  verificationActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#F7FAFC",
    flex: 0.48,
  },
  verifiedButton: {
    backgroundColor: "#48BB78",
  },
  missingButton: {
    backgroundColor: "#F56565",
  },
  actionText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#2D3748",
  },
  verifiedText: {
    color: "white",
  },
  missingText: {
    color: "white",
  },
  notesInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#4A5568",
    height: 80,
    textAlignVertical: "top",
  },
  emptyListText: {
    fontSize: 16,
    color: "#718096",
    textAlign: "center",
    marginVertical: 24,
  },
  summary: {
    marginTop: 16,
    backgroundColor: "#F7FAFC",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  summaryText: {
    fontSize: 14,
    color: "#4A5568",
    marginBottom: 8,
  },
  submitButton: {
    marginBottom: 24,
  },
});

export default SPOrderVerificationScreen;
