import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList,Button } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
const TrackOrderScreen = () => {
  const navigation = useNavigation();
  const [orderSteps] = useState([
    { id: '1', label: 'Order Confirmed', time: '1 Dec 2024, 04:25 PM', icon: 'checkmark-circle' },
    { id: '2', label: 'Picked Up', time: '1 Dec 2024, 05:25 PM', icon: 'cube' },
    { id: '3', label: 'In Progress', time: '1 Dec 2024, 08:25 PM', icon: 'shirt' },
    { id: '4', label: 'Dispatched', time: '2 Dec 2024, 09:00 AM', icon: 'bus' },
    { id: '5', label: 'Delivered', time: '2 Dec 2024, 06:25 AM', icon: 'home' },
  ]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Track Order</Text>
      <Text style={styles.orderId}>Order #LDR0215AA1</Text>
      <FlatList
        data={orderSteps}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={item.icon}
                size={24}
                color={index === orderSteps.length - 1 ? '#757575' : '#007bff'}
              />
              {index !== orderSteps.length - 1 && <View style={styles.verticalLine} />}
            </View>
            <View style={styles.stepDetails}>
              <Text style={styles.stepLabel}>{item.label}</Text>
              <Text style={styles.stepTime}>{item.time}</Text>
            </View>
          </View>
        )}
      />

      <Button title='Give a Rating' onPress={()=>navigation.navigate('Rating')}/>
      {/* <View style={styles.orderDetails}>
        <Text style={styles.sectionTitle}>Order Details</Text>
        <Text style={styles.orderItem}>3 X T-Shirt (Men)</Text>
        <Text style={styles.orderItem}>2 X Jeans (Men)</Text>
        <Text style={styles.orderItem}>1 X Sneakers</Text>
        <Text style={styles.orderItem}>1 X Jacket (Men)</Text>
      </View> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
    textAlign: 'center',
  },
  orderId: {
    fontSize: 16,
    color: '#555555',
    marginBottom: 20,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginRight: 15,
  },
  verticalLine: {
    width: 2,
    height: 30,
    backgroundColor: '#d3d3d3',
    marginVertical: 5,
  },
  stepDetails: {
    flex: 1,
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  stepTime: {
    fontSize: 14,
    color: '#777777',
  },
  orderDetails: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingTop: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 10,
  },
  orderItem: {
    fontSize: 16,
    color: '#555555',
    marginBottom: 5,
  },
});

export default TrackOrderScreen;
