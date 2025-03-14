import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList } from 'react-native';
import { firestore } from '../../firebaseConfig'; // Adjust the import based on your file structure
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { auth } from '../../firebaseConfig'; // Adjust the import based on your file structure

const ServiceProviderOrders = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const serviceProviderId = auth.currentUser.uid;
      const ordersRef = collection(firestore, 'orders');
      const q = query(ordersRef, where('serviceProviderId', '==', serviceProviderId));
      const querySnapshot = await getDocs(q);
      const ordersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(ordersList);
    };

    fetchOrders();
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    const orderRef = doc(firestore, 'orders', orderId);
    await updateDoc(orderRef, {
      status: newStatus,
      // Optionally, add a timestamp for the status update
      [`${newStatus}At`]: new Date().toISOString(),
    });
  };

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View>
          <Text>Order ID: {item.id}</Text>
          <Text>Status: {item.status}</Text>
          {/* Add buttons or dropdowns to update status */}
          <Button title="Mark as Picked Up" onPress={() => updateOrderStatus(item.id, 'pickedUp')} />
          <Button title="Mark as In Progress" onPress={() => updateOrderStatus(item.id, 'inProgress')} />
          <Button title="Mark as Dispatched" onPress={() => updateOrderStatus(item.id, 'dispatched')} />
          <Button title="Mark as Delivered" onPress={() => updateOrderStatus(item.id, 'delivered')} />
        </View>
      )}
    />
  );
};

export default ServiceProviderOrders;
