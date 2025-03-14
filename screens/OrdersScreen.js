import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Orders from '../components/Orders';
import { getOrdersByUser} from '../helpers/data';
import { getAuth } from "firebase/auth";

const auth = getAuth(); // Initialize Firebase Auth
const OrderScreen = () => {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('current'); // Default to 'current' tab
  console.log(auth.currentUser?.uid)
  useEffect(() => {
    const fetchOrders = async () => {      
      const ordersData = await getOrdersByUser(auth.currentUser?.uid); // Fetch orders from Firebase or service
      setOrders(ordersData);
    };

    fetchOrders(); // Fetch orders when the component mounts
  }, []);

  // Filter orders based on the status and active tab
  const filteredOrders = orders.filter(order => 
    activeTab === 'current' ? order.status === 'Pending' : order.status === 'Completed'
  );

  return (
    <View style={styles.container}>
      {/* Tab Buttons */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          onPress={() => setActiveTab('current')} 
          style={[styles.tabButton, activeTab === 'current' && styles.activeTab]}>
          <Text style={styles.tabText}>Current Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('completed')} 
          style={[styles.tabButton, activeTab === 'completed' && styles.activeTab]}>
          <Text style={styles.tabText}>Completed Orders</Text>
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      <ScrollView style={styles.ordersContainer}>
        {filteredOrders.length > 0 ? (
          filteredOrders.map(order => (
            <Orders key={order.orderId} order={order} />
          ))
        ) : (
          <Text style={styles.noOrdersText}>No orders to display</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    margin:15,
    backgroundColor: '#f4f4f4',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderColor: '#ddd',
  },
  tabButton: {
    padding: 10,
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'white',
    borderBottomWidth: 3,
    borderBottomColor: '#007bff',
  },
  tabText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'blue',
  },
  ordersContainer: {
    flex: 1,
  },
  noOrdersText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 18,
    color: 'gray',
  },
});

export default OrderScreen;
