import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import Geolocation from '@react-native-community/geolocation';

const ServiceProviderListScreen = () => {
  const [serviceProviders, setServiceProviders] = useState([]);
  const [location, setLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Get user's location
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        fetchServiceProviders(latitude, longitude);
      },
      (error) => {
        Alert.alert("Error", "Unable to retrieve location");
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
    );
  }, []);

  const fetchServiceProviders = (latitude, longitude) => {
    // Fetch service providers from your database
    // This is a placeholder for your actual data fetching logic
    const providers = [
      { id: 1, name: "Provider A", distance: 5 },
      { id: 2, name: "Provider B", distance: 8 },
      { id: 3, name: "Provider C", distance: 12 },
      // Add more providers as needed
    ];

    // Filter providers within 10 km radius
    const filteredProviders = providers.filter(provider => provider.distance <= 10);
    setServiceProviders(filteredProviders);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const filteredProviders = serviceProviders.filter(provider =>
    provider.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search for a service provider"
        value={searchQuery}
        onChangeText={handleSearch}
      />
      <FlatList
        data={filteredProviders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.providerCard}>
            <Text style={styles.providerName}>{item.name}</Text>
            <Text style={styles.providerDistance}>{item.distance} km away</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  searchInput: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  providerCard: {
    padding: 15,
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  providerName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  providerDistance: {
    color: "#777",
  },
});

export default ServiceProviderListScreen; 