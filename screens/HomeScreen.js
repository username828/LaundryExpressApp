import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  TextInput,
  Pressable,
} from "react-native";
import * as Location from "expo-location";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Picker } from "@react-native-picker/picker";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../firebaseConfig"; // Import Firestore DB
import { useNavigation } from "@react-navigation/native";

// ServiceProviderCard Component
const ServiceProviderCard = ({ provider }) => {
  const navigation = useNavigation();
  const [isFavourite,setIsFavourite]=useState(false);
  const handleFavourite=()=>{
    setIsFavourite(prevState=>!prevState);
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate("ServiceProviderScreen", {
          providerId: provider.serviceProviderId,
        })
      }
    >
      <Image source={{ uri: provider.image }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <View style={styles.providerNameContainer}>
          <Text style={styles.providerName}>{provider.name}</Text>
        </View>
        <Text style={styles.rating}>Rating: {provider.rating}</Text>
        <Pressable onPress={handleFavourite}>
            <MaterialIcons name={isFavourite? "favorite":"favorite-outline"} size={24} color="red"/>
          </Pressable>
      </View>
    </TouchableOpacity>
  );
};

const HomeScreen = () => {
  const [serviceProviders, setServiceProviders] = useState([]);
  const [currentAddress, setCurrentAddress] = useState("Loading Location...");
  const [selectedServiceType, setSelectedServiceType] = useState("");
  const [filterOption, setFilterOption] = useState("");
  const [sortOption, setSortOption] = useState("");

  // Fetch service providers from Firestore
  useEffect(() => {
    const fetchServiceProviders = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "serviceProviders"));
        const providers = querySnapshot.docs.map((doc) => doc.data());
        setServiceProviders(providers);
      } catch (error) {
        console.error("Error fetching service providers: ", error);
      }
    };

    fetchServiceProviders();
  }, []);

  // Location handling
  useEffect(() => {
    const checkLocationEnabled = async () => {
      let enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        Alert.alert("Location not Enabled", "Enable Location", [
          { text: "Cancel", style: "cancel" },
          { text: "OK" },
        ]);
      }
    };

    const getCurrentLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission not Granted", "Allow Location Services", [
          { text: "Cancel", style: "cancel" },
          { text: "OK" },
        ]);
      }

      const { coords } = await Location.getCurrentPositionAsync();
      const address = await reverseGeocode(coords.latitude, coords.longitude);
      setCurrentAddress(address);
    };

    const reverseGeocode = async (latitude, longitude) => {
      try {
        const result = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        if (result.length > 0) {
          const { city, region, country, name } = result[0];
          return `${name}, ${city}, ${region}, ${country}`;
        }
        return "Address not found";
      } catch (error) {
        console.error("Reverse Geocoding Error:", error);
        return "Error fetching address";
      }
    };

    checkLocationEnabled();
    getCurrentLocation();
  }, []);

  return (
    <SafeAreaView style={{ backgroundColor: "white", flex: 1 }}>
      {/* Header with Location */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 20 }}>
        <MaterialIcons name="location-on" size={30} color="black" />
        <View>
          <Text style={{ fontSize: 10, fontWeight: "600" }}>Home</Text>
          <Text>{currentAddress}</Text>
        </View>
        <Pressable style={{ marginLeft: "auto" }}>
          <MaterialIcons name="favorite" size={24} color="red" />
        </Pressable>
      </View>

      {/* Search Bar */}
      <View
        style={{
          padding: 10,
          margin: 10,
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 0.8,
          borderRadius: 7,
          backgroundColor: "white",
        }}
      >
        <MaterialIcons name="search" size={24} color="black" />
        <TextInput
          placeholder="Search for Laundry Services"
          style={{ flex: 1, marginLeft: 8 }}
        />
      </View>

      {/* Filters and Sort Options */}
      <View style={{ paddingHorizontal: 10, flexDirection: "row", gap: 20 }}>
        <View style={styles.dropdownContainer}>
          <Picker
            selectedValue={filterOption}
            onValueChange={(itemValue) => setFilterOption(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Filter" value="" />
            <Picker.Item label="By Distance" value="distance" />
            <Picker.Item label="By Rating" value="rating" />
          </Picker>
        </View>

        <View style={styles.dropdownContainer}>
          <Picker
            selectedValue={sortOption}
            onValueChange={(itemValue) => setSortOption(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Sort" value="" />
            <Picker.Item label="Price: Low to High" value="low_to_high" />
            <Picker.Item label="Price: High to Low" value="high_to_low" />
          </Picker>
        </View>

        <View style={styles.dropdownContainer}>
          <Picker
            selectedValue={selectedServiceType}
            onValueChange={(itemValue) => setSelectedServiceType(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Service Type" value="" />
            <Picker.Item label="Washing" value="washing" />
            <Picker.Item label="Laundry" value="laundry" />
            <Picker.Item label="Wash & Iron" value="wash_iron" />
            <Picker.Item label="Cleaning" value="cleaning" />
          </Picker>
        </View>
      </View>

      {/* Service Providers List */}
      <FlatList
        data={serviceProviders}
        keyExtractor={(item) => item.serviceProviderId}
        renderItem={({ item }) => <ServiceProviderCard provider={item} />}
        contentContainerStyle={{ padding: 10 }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    padding: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  cardContent: {
    justifyContent: "center",
  },
  providerName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  providerNameContainer: {
    flexDirection: "row",
    alignItems: "center", // Align text and icon vertically
    justifyContent: "space-between", // Space between provider name and icon
    width: "100%", // Ensure it takes full width
  },

  favoriteIcon: {
    marginLeft: "auto", // Push the icon to the right end
  },
  rating: {
    fontSize: 14,
    color: "#555",
  },
  dropdownContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f9f9f9",
  },
  picker: {
    height: 50,
    color: "black",
  },
});

export default HomeScreen;

// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   SafeAreaView,
//   FlatList,
//   TouchableOpacity,
//   Image,
//   StyleSheet,
//   Alert,
//   TextInput,
//   Pressable,
// } from 'react-native';
// import * as Location from 'expo-location';
// import MaterialIcons from '@expo/vector-icons/MaterialIcons';
// import { Picker } from '@react-native-picker/picker';
// import { getDocs, collection } from 'firebase/firestore';
// import { db } from '../firebaseConfig'; // Import Firestore DB
// import { useNavigation } from '@react-navigation/native';

// // ServiceProviderCard Component
// const ServiceProviderCard = ({ provider }) => {
//   const navigation = useNavigation();

//   return (
//     <TouchableOpacity
//       style={styles.card}
//       onPress={() =>
//         navigation.navigate('ServiceProviderScreen', { providerId: provider.serviceProviderId })
//       }
//     >
//       <Image source={{ uri: provider.image }} style={styles.cardImage} />
//       <View style={styles.cardContent}>
//         <Text style={styles.providerName}>{provider.name}</Text>
//         <Text style={styles.rating}>Rating: {provider.rating}</Text>
//       </View>
//     </TouchableOpacity>
//   );
// };

// const HomeScreen = () => {
//   const [serviceProviders, setServiceProviders] = useState([]);
//   const [filteredServiceProviders, setFilteredServiceProviders] = useState([]);
//   const [currentAddress, setCurrentAddress] = useState('Loading Location...');
//   const [selectedServiceType, setSelectedServiceType] = useState('');
//   const [filterOption, setFilterOption] = useState('');
//   const [sortOption, setSortOption] = useState('');

//   // Fetch service providers from Firestore
//   useEffect(() => {
//     const fetchServiceProviders = async () => {
//       try {
//         const querySnapshot = await getDocs(collection(db, 'serviceProviders'));
//         const providers = querySnapshot.docs.map((doc) => doc.data());
//         setServiceProviders(providers);
//         setFilteredServiceProviders(providers);
//       } catch (error) {
//         console.error('Error fetching service providers: ', error);
//       }
//     };

//     fetchServiceProviders();
//   }, []);

//   // Apply filtering and sorting whenever filters or sort options change
//   useEffect(() => {
//     const applyFiltersAndSorting = () => {
//       let filteredProviders = [...serviceProviders];

//       // Filter by service type
//       if (selectedServiceType) {
//         filteredProviders = filteredProviders.filter(
//           (provider) => provider.serviceType === selectedServiceType
//         );
//       }

//       // Sort by rating
//       if (filterOption === 'rating') {
//         filteredProviders.sort((a, b) => b.rating - a.rating);
//       }

//       // Sort by price
//       if (sortOption === 'low_to_high') {
//         filteredProviders.sort((a, b) => a.price - b.price);
//       } else if (sortOption === 'high_to_low') {
//         filteredProviders.sort((a, b) => b.price - a.price);
//       }

//       setFilteredServiceProviders(filteredProviders);
//     };

//     applyFiltersAndSorting();
//   }, [selectedServiceType, filterOption, sortOption, serviceProviders]);

//   // Location handling
//   useEffect(() => {
//     const checkLocationEnabled = async () => {
//       let enabled = await Location.hasServicesEnabledAsync();
//       if (!enabled) {
//         Alert.alert('Location not Enabled', 'Enable Location', [
//           { text: 'Cancel', style: 'cancel' },
//           { text: 'OK' },
//         ]);
//       }
//     };

//     const getCurrentLocation = async () => {
//       const { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== 'granted') {
//         Alert.alert('Permission not Granted', 'Allow Location Services', [
//           { text: 'Cancel', style: 'cancel' },
//           { text: 'OK' },
//         ]);
//       }

//       const { coords } = await Location.getCurrentPositionAsync();
//       const address = await reverseGeocode(coords.latitude, coords.longitude);
//       setCurrentAddress(address);
//     };

//     const reverseGeocode = async (latitude, longitude) => {
//       try {
//         const result = await Location.reverseGeocodeAsync({ latitude, longitude });
//         if (result.length > 0) {
//           const { city, region, country, name } = result[0];
//           return `${name}, ${city}, ${region}, ${country}`;
//         }
//         return 'Address not found';
//       } catch (error) {
//         console.error('Reverse Geocoding Error:', error);
//         return 'Error fetching address';
//       }
//     };

//     checkLocationEnabled();
//     getCurrentLocation();
//   }, []);

//   return (
//     <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }}>
//       {/* Header with Location */}
//       <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20 }}>
//         <MaterialIcons name="location-on" size={30} color="black" />
//         <View>
//           <Text style={{ fontSize: 10, fontWeight: '600' }}>Home</Text>
//           <Text>{currentAddress}</Text>
//         </View>
//         <Pressable style={{ marginLeft: 'auto' }}>
//           <MaterialIcons name="favorite" size={24} color="red" />
//         </Pressable>
//       </View>

//       {/* Search Bar */}
//       <View
//         style={{
//           padding: 10,
//           margin: 10,
//           flexDirection: 'row',
//           alignItems: 'center',
//           borderWidth: 0.8,
//           borderRadius: 7,
//           backgroundColor: 'white',
//         }}
//       >
//         <MaterialIcons name="search" size={24} color="black" />
//         <TextInput
//           placeholder="Search for Laundry Services"
//           style={{ flex: 1, marginLeft: 8 }}
//         />
//       </View>

//       {/* Filters and Sort Options */}
//       <View style={{ paddingHorizontal: 10, flexDirection: 'row', gap: 20 }}>
//         <View style={styles.dropdownContainer}>
//           <Picker
//             selectedValue={filterOption}
//             onValueChange={(itemValue) => setFilterOption(itemValue)}
//             style={styles.picker}
//           >
//             <Picker.Item label="Filter" value="" />
//             <Picker.Item label="By Rating" value="rating" />
//           </Picker>
//         </View>

//         <View style={styles.dropdownContainer}>
//           <Picker
//             selectedValue={sortOption}
//             onValueChange={(itemValue) => setSortOption(itemValue)}
//             style={styles.picker}
//           >
//             <Picker.Item label="Sort" value="" />
//             <Picker.Item label="Price: Low to High" value="low_to_high" />
//             <Picker.Item label="Price: High to Low" value="high_to_low" />
//           </Picker>
//         </View>

//         <View style={styles.dropdownContainer}>
//           <Picker
//             selectedValue={selectedServiceType}
//             onValueChange={(itemValue) => setSelectedServiceType(itemValue)}
//             style={styles.picker}
//           >
//             <Picker.Item label="Service Type" value="" />
//             <Picker.Item label="Washing" value="washing" />
//             <Picker.Item label="Laundry" value="laundry" />
//             <Picker.Item label="Wash & Iron" value="wash_iron" />
//             <Picker.Item label="Cleaning" value="cleaning" />
//           </Picker>
//         </View>
//       </View>

//       {/* Service Providers List */}
//       {filteredServiceProviders.length === 0 ? (
//         <Text style={{ textAlign: 'center', margin: 20 }}>
//           No providers match the selected criteria.
//         </Text>
//       ) : (
//         <FlatList
//           data={filteredServiceProviders}
//           keyExtractor={(item) => item.serviceProviderId}
//           renderItem={({ item }) => <ServiceProviderCard provider={item} />}
//           contentContainerStyle={{ padding: 10 }}
//         />
//       )}
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   card: {
//     flexDirection: 'row',
//     padding: 16,
//     marginBottom: 16,
//     backgroundColor: '#fff',
//     borderRadius: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 6,
//     elevation: 3,
//   },
//   cardImage: {
//     width: 80,
//     height: 80,
//     borderRadius: 8,
//     marginRight: 16,
//   },
//   cardContent: {
//     justifyContent: 'center',
//   },
//   providerName: {
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   rating: {
//     fontSize: 14,
//     color: '#555',
//   },
//   dropdownContainer: {
//     flex: 1,
//     borderWidth: 1,
//     borderColor: '#aaa',
//     borderRadius: 8,
//     overflow: 'hidden',
//     backgroundColor: '#f9f9f9',
//   },
//   picker: {
//     height: 50,
//     color: 'black',
//   },
// });

// export default HomeScreen;
