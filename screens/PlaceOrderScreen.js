// import React, { useState } from 'react';
// import { StyleSheet, Text, View, Button, TextInput } from 'react-native';
// import { Picker } from '@react-native-picker/picker';
// import { useRoute } from '@react-navigation/core';
// import { doc, setDoc, collection } from 'firebase/firestore';
// import { db } from '../firebaseConfig';
// import DateTimePicker from '@react-native-community/datetimepicker';

// const PlaceOrderScreen = () => {
//   const route = useRoute();
//   const { providerId, availableServices } = route.params;

//   const [serviceType, setServiceType] = useState('');
//   const [price, setPrice] = useState(0);
//   const [address, setAddress] = useState('');
//   const [orderTime, setOrderTime] = useState('');
//   const [showDateTimePicker, setShowDateTimePicker] = useState(false);
//   const [selectedDate, setSelectedDate] = useState(new Date());

//   const handleServiceChange = (selectedService) => {
//     setServiceType(selectedService);
//     setPrice(selectedService === 'laundry' ? 20 : selectedService === 'dry cleaning' ? 30 : 0);
//   };

//   const onDateChange = (event, selectedDate) => {
//     if (event.type === 'set' && selectedDate) {
//       setShowDateTimePicker(false);
//       setSelectedDate(selectedDate);
//       setOrderTime(selectedDate.toLocaleString());
//     } else {
//       setShowDateTimePicker(false);
//     }
//   };

//   const handlePlaceOrder = async () => {
//     try {
//       const orderRef = doc(collection(db, 'orders'));
//       const orderId = orderRef.id;
//       const customerId = 'customer1';

//       await setDoc(orderRef, {
//         orderId,
//         customerId,
//         serviceProviderId: providerId,
//         serviceType,
//         price,
//         address,
//         status: 'pending',
//         orderTime,
//         createdAt: new Date(),
//       });
//     } catch (error) {
//       console.error('Error placing order: ', error);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Place Order</Text>

//       <Text style={styles.label}>Service Type</Text>
//       <Picker
//         selectedValue={serviceType}
//         onValueChange={handleServiceChange}
//         style={styles.picker}
//         dropdownIconColor="#555"
//       >
//         <Picker.Item label="Select a service" value="" />
//         {availableServices.map((service, index) => (
//           <Picker.Item key={index} label={service} value={service} />
//         ))}
//       </Picker>

//       <Text style={styles.label}>Price</Text>
//       <Text style={styles.price}>${price}</Text>

//       <Text style={styles.label}>Address</Text>
//       <TextInput
//         style={styles.input}
//         placeholder="Enter your address"
//         value={address}
//         onChangeText={setAddress}
//       />

//       <Text style={styles.label}>Order Time</Text>
//       <Button title="Select Order Time" onPress={() => setShowDateTimePicker(true)} color="#007AFF" />
//       {showDateTimePicker && (
//         <DateTimePicker
//           value={selectedDate}
//           mode="datetime"
//           display="default"
//           onChange={onDateChange}
//         />
//       )}
//       {orderTime ? <Text style={styles.orderTime}>Selected Time: {orderTime}</Text> : null}

//       <Button title="Place Order" onPress={handlePlaceOrder} color="#007AFF" />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     padding: 16,
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 20,
//     textAlign: 'center',
//     color: '#333',
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: '500',
//     marginBottom: 8,
//     color: '#555',
//   },
//   picker: {
//     backgroundColor: '#f9f9f9',
//     borderRadius: 8,
//     marginBottom: 16,
//     paddingHorizontal: 8,
//     height: 50,
//     justifyContent: 'center',
//   },
//   price: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 16,
//   },
//   input: {
//     backgroundColor: '#f9f9f9',
//     borderRadius: 8,
//     borderColor: '#ddd',
//     borderWidth: 1,
//     height: 50,
//     paddingHorizontal: 10,
//     marginBottom: 16,
//     color: '#333',
//   },
//   orderTime: {
//     fontSize: 14,
//     color: '#555',
//     marginVertical: 10,
//   },
// });

// export default PlaceOrderScreen;


import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRoute } from '@react-navigation/core';
import { doc, setDoc, collection } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/core';

const PlaceOrderScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { providerId, availableServices } = route.params;

  const [serviceType, setServiceType] = useState('');
  const [price, setPrice] = useState(0);
  const [address, setAddress] = useState('');
  const [orderTime, setOrderTime] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  // Sample data for dates and time slots
  const dates = [
    { id: '1', day: 'Tomorrow', date: 'Oct 05' },
    { id: '2', day: 'Sunday', date: 'Oct 06' },
    { id: '3', day: 'Monday', date: 'Oct 07' },
    { id: '4', day: 'Tuesday', date: 'Oct 08' },
    { id: '5', day: 'Wednesday', date: 'Oct 09' },
    { id: '6', day: 'Thursday', date: 'Oct 10' },
  ];

  const timeSlots = [
    '08:00 am - 09:00 am',
    '09:00 am - 10:00 am',
    '10:00 am - 11:00 am',
    '11:00 am - 12:00 pm',
    '12:00 pm - 01:00 pm',
    '03:00 pm - 04:00 pm',
  ];

  const handlePlaceOrder = async () => {
    try {
      const orderRef = doc(collection(db, 'orders'));
      const orderId = orderRef.id;
      const customerId = 'customer1';

      await setDoc(orderRef, {
        orderId,
        customerId,
        serviceProviderId: providerId,
        serviceType,
        price,
        address,
        status: 'pending',
        orderTime: `${selectedDate} ${selectedTime}`,
        createdAt: new Date(),

      
      });

      navigation.navigate('Track');
    } catch (error) {
      console.error('Error placing order: ', error);
    }
  };

  const handleServiceChange = (selectedService) => {
    setServiceType(selectedService);
    setPrice(selectedService === 'laundry' ? 20 : selectedService === 'dry cleaning' ? 30 : 0);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Place Order</Text>

      <Text style={styles.label}>Service Type</Text>
      <Picker
        selectedValue={serviceType}
        onValueChange={handleServiceChange}
        style={styles.picker}
        dropdownIconColor="#555"
      >
        <Picker.Item label="Select a service" value="" />
        {availableServices.map((service, index) => (
          <Picker.Item key={index} label={service} value={service} />
        ))}
      </Picker>

      <Text style={styles.label}>Price</Text>
      <Text style={styles.price}>${price}</Text>

      <Text style={styles.label}>Address</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your address"
        value={address}
        onChangeText={setAddress}
      />

      <Text style={styles.label}>Order Time</Text>
      <TouchableOpacity
        style={styles.selectTimeButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.selectTimeText}>
          {selectedDate && selectedTime ? `${selectedDate} ${selectedTime}` : 'Select Order Time'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.placeOrderButton} onPress={handlePlaceOrder}>
        <Text style={styles.placeOrderText}>Place Order</Text>
      </TouchableOpacity>

      {/* Modal for Date-Time Picker */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Date and Time</Text>

            <Text style={styles.modalSubtitle}>Select a Date</Text>
            <FlatList
              data={dates}
              keyExtractor={(item) => item.id}
              horizontal
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dateCard,
                    selectedDate === `${item.day} ${item.date}` && styles.dateCardSelected,
                  ]}
                  onPress={() => setSelectedDate(`${item.day} ${item.date}`)}
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
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#555',
  },
  picker: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 8,
    height: 50,
    justifyContent: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderColor: '#ddd',
    borderWidth: 1,
    height: 50,
    paddingHorizontal: 10,
    marginBottom: 16,
    color: '#333',
  },
  selectTimeButton: {
    backgroundColor: '#eef',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  selectTimeText: {
    color: '#333',
    fontSize: 16,
  },
  placeOrderButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '90%',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  dateCard: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    margin: 5,
    borderRadius: 8,
    alignItems: 'center',
  },
  dateCardSelected: {
    backgroundColor: '#007AFF',
  },
  dateText: {
    color: '#333',
  },
  timeCard: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    margin: 5,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeCardSelected: {
    backgroundColor: '#007AFF',
  },
  timeText: {
    color: '#333',
  },
  doneButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    marginTop: 20,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  doneButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default PlaceOrderScreen;