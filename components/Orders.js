import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

// The Orders component receives an order object as a prop
const Orders = ({ order }) => {
  return (
    <View style={styles.orderContainer}>
      <Text style={styles.orderId}>Order ID: {order.orderId}</Text>
      <Text style={styles.serviceType}>Service: {order.serviceType}</Text>
      <Text style={styles.status}>Status: {order.status}</Text>
      <Text style={styles.price}>Price: ${order.price}</Text>
      <Text style={styles.address}>Address: {order.address}</Text>
      <Text style={styles.createdAt}>
        Created At: {new Date(order.createdAt.seconds * 1000).toLocaleString()}
      </Text>
    </View>
  )
}

export default Orders

const styles = StyleSheet.create({
  orderContainer: {
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  serviceType: {
    fontSize: 16,
    marginVertical: 4,
  },
  status: {
    fontSize: 14,
    color: 'gray',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  address: {
    fontSize: 14,
    color: 'gray',
  },
  createdAt: {
    fontSize: 12,
    color: 'gray',
  },
})
