import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  Button,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { firestore } from '../firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';

const TrackOrderScreen = ({ route }) => {
  const navigation = useNavigation();
  const { orderId,providerId } = route.params;

  const [orderSteps, setOrderSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(null);

  // Order steps
  const allSteps = [
    { id: 'ordered', label: 'Order Placed', icon: 'checkmark-circle-outline' },
    { id: 'pickedUp', label: 'Picked Up', icon: 'cart' },
    { id: 'washing', label: 'Washing', icon: 'water' },
    { id: 'ironing', label: 'Ironing', icon: 'shirt' },
    { id: 'dispatched', label: 'Out for Delivery', icon: 'bus' },
    { id: 'delivered', label: 'Delivered', icon: 'home' },
  ];

  useEffect(() => {
    const orderRef = doc(firestore, 'orders', orderId);
    const unsubscribe = onSnapshot(orderRef, (doc) => {
      if (doc.exists()) {
        const orderData = doc.data();
        const activeStepIndex = allSteps.findIndex(step => step.label === orderData.status);
        const steps = allSteps.map((step, index) => ({
          ...step,
          completed: index <= activeStepIndex,
        }));
        setOrderSteps(steps);
        setCurrentStep(orderData.status);
      } else {
        setOrderSteps([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [orderId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Track Your Order</Text>
      <Text style={styles.orderId}>Order ID: {orderId}</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
      ) : (
        <ScrollView style={styles.scrollView} >
          {/* Timeline Progress */}
          <FlatList
            data={orderSteps}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <View style={styles.stepContainer}>
                {/* Progress Indicator */}
                <View style={styles.timeline}>
                  <Ionicons
                    name={item.icon}
                    size={26}
                    color={item.completed ? "#007AFF" : "#B0BEC5"}
                  />
                  {index !== orderSteps.length - 1 && (
                    <View style={[styles.line, item.completed && styles.completedLine]} />
                  )}
                </View>

                {/* Step Details */}
                <View style={styles.stepDetails}>
                  <Text style={[styles.stepLabel, item.completed && styles.completedText]}>
                    {item.label}
                  </Text>
                  <Text style={styles.stepTime}>{item.time || "Pending"}</Text>
                </View>
              </View>
            )}
          />

          {/* Current Status */}
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>Current Status:</Text>
            <Text style={[styles.statusValue, getStatusStyle(currentStep)]}>
              {currentStep || "Pending"}
            </Text>
          </View>

          {/* Estimated Delivery Time */}
          <View style={styles.footer}>
            <Text style={styles.estimatedTime}>
              Estimated Delivery: {orderSteps.find(step => step.id === 'delivered')?.time || "Pending"}
            </Text>
          </View>

          {/* Rating Button - Only visible when order is Delivered */}
          
            <View style={styles.buttonContainer}>
              <Button
                title="Give a Rating"
                color="#007AFF"
                onPress={() => navigation.navigate("Rating", { orderId,providerId })}
              />
            </View>
          
        </ScrollView>
      )}
    </View>
  );
};

// Get Status Style Based on Current Step
const getStatusStyle = (currentStep) => {
  switch (currentStep) {
    case "Order Placed":
      return { color: "#555" };
    case "Picked Up":
      return { color: "#FFA500" };
    case "Washing":
      return { color: "#4682B4" };
    case "Ironing":
      return { color: "#8B4513" };
    case "Out for Delivery":
      return { color: "#FF4500" };
    case "Delivered":
      return { color: "#008000" };
    default:
      return { color: "gray" };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  scrollView: {
    marginTop: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: "center",
    marginBottom: 10,
  },
  orderId: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
    color: "#555",
  },
  stepContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },
  timeline: {
    flexDirection: "column",
    alignItems: "center",
    marginRight: 15,
  },
  line: {
    width: 2,
    height: 30,
    backgroundColor: "#B0BEC5",
  },
  completedLine: {
    backgroundColor: "#007AFF",
  },
  stepDetails: {
    flex: 1,
    paddingLeft: 10,
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  completedText: {
    color: "#007AFF",
  },
  stepTime: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },
  statusContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    alignItems: "center",
  },
  statusText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
  },
  statusValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 5,
  },
  footer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    alignItems: "center",
  },
  estimatedTime: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#007AFF",
  },
  buttonContainer: {
    marginTop: 20,
    alignItems: "center",
  },
});

export default TrackOrderScreen;
