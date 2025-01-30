import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, FlatList, Button } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { ScrollView } from 'react-native-gesture-handler';

const ServiceProviderScreen = () => {
  const route = useRoute();
  const { providerId } = route.params; // Get providerId from route params

  const [providerDetails, setProviderDetails] = useState(null);
  const [services, setServices] = useState([]);

  const navigation = useNavigation();
  useEffect(() => {
    const fetchProviderDetails = async () => {
      try {
        const docRef = doc(db, 'serviceProviders', providerId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          console.log(docSnap.data())
          setProviderDetails(docSnap.data());
          console.log(docSnap.data().services);
          setServices(docSnap.data().services || []);  // Set the services array
        } else {
          console.error('No such document!');
        }
      } catch (error) {
        console.error('Error fetching provider details: ', error);
      }
    };

    fetchProviderDetails();
  }, [providerId]);

  if (!providerDetails) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Data for Special Offers (hardcoded)
  const specialOffers = [
    { id: '1', title: '20% off on first service!' },
    { id: '2', title: 'Free pickup for orders above $50' },
    { id: '3', title: 'Get 1 item free for every 10 items' },
  ];

  const renderProviderDetails = () => (
    <View style={styles.header}>
      <Image 
        source={{ uri: providerDetails.image || 'default_image_url' }} 
        style={styles.providerImage} 
      />
      <Text style={styles.providerName}>{providerDetails.name || 'Default Provider'}</Text>
      <Text style={styles.rating}>Rating: {providerDetails.rating || 'N/A'}</Text>
      <Text style={styles.description}>
        {providerDetails.description || 'No description available'}
      </Text>
    </View>
  );

  const renderSpecialOffers = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Special Offers</Text>
      {specialOffers.map((offer) => (
        <Text key={offer.id} style={styles.offerItem}>- {offer.title}</Text>
      ))}
    </View>
  );

  const renderServiceItem = ({ item }) => (
    <View style={styles.serviceItem}>
      <Text style={styles.serviceName}>{item.name ? String(item.name) : 'Unnamed Service'}</Text>  
      <Text style={styles.servicePrice}>{item.price ? `$${String(item.price)}` : 'Price Unavailable'}</Text>  
    </View>
  );

  const handleOrderPlacement = () => {
    navigation.navigate('OrderPlacement', {
      providerId,
      availableServices: services,
    });
  };

  return (
    <View>
      <FlatList
        data={[{ key: 'providerDetails' }, { key: 'specialOffers' }, { key: 'services' }]}
        renderItem={({ item }) => {
          if (item.key === 'providerDetails') {
            return renderProviderDetails();
          }
          if (item.key === 'specialOffers') {
            return renderSpecialOffers();
          }
          if (item.key === 'services') {
            return (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Services Offered</Text>
                <FlatList
                  data={services}  
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={renderServiceItem}
                />
              </View>
            );
          }
        }}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.container}
      />
      <Button title='Place Order' onPress={handleOrderPlacement}/>
   </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9f9f9',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  providerImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  providerName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  rating: {
    fontSize: 16,
    color: '#555',
  },
  description: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  offerItem: {
    fontSize: 16,
    marginBottom: 8,
    color: '#444',
  },
  serviceItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  servicePrice: {
    fontSize: 14,
    color: '#888',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ServiceProviderScreen;
