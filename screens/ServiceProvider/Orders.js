import { useState, useEffect } from 'react';
import { View, Text, FlatList, Button, Alert } from 'react-native';
import { firestore } from '../../firebaseConfig';
import { collection, getDocs, updateDoc, doc, arrayUnion } from 'firebase/firestore';

const ServiceProviderOrders = () => {
  const [orders, setOrders] = useState([]);
  const serviceProviderId = "provider1"; // Replace with authenticated service provider ID

  useEffect(() => {
    const fetchOrders = async () => {
      const querySnapshot = await getDocs(collection(firestore, 'orders'));
      const fetchedOrders = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((order) => order.serviceProviderId === serviceProviderId);
      setOrders(fetchedOrders);
    };
    fetchOrders();
  }, []);

  const getNextStatus = (currentStatus) => {
    const statuses = ["pending", "confirmed", "picked_up", "in_progress", "dispatched", "delivered"];
    const currentIndex = statuses.indexOf(currentStatus);
    return currentIndex < statuses.length - 1 ? statuses[currentIndex + 1] : null;
  };

  const updateOrderStatus = async (orderId, currentStatus) => {
    const nextStatus = getNextStatus(currentStatus);
    if (!nextStatus) return Alert.alert("Order already completed");

    try {
      const orderRef = doc(firestore, 'orders', orderId);
      await updateDoc(orderRef, {
        status: nextStatus,
        statusHistory: arrayUnion({ status: nextStatus, timestamp: new Date().toISOString() }),
      });
      Alert.alert('Success', `Order updated to ${nextStatus}`);
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  return (
    <View>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>Orders</Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const nextStatus = getNextStatus(item.status);
          return (
            <View style={{ padding: 10, borderBottomWidth: 1 }}>
              <Text>Order ID: {item.orderId}</Text>
              <Text>Status: {item.status}</Text>
              {nextStatus && (
                <Button title={`Move to ${nextStatus}`} onPress={() => updateOrderStatus(item.id, item.status)} />
              )}
            </View>
          );
        }}
      />
    </View>
  );
};

export default ServiceProviderOrders;
