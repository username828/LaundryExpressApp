import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, firestore } from '../../firebaseConfig';
import { useNavigation } from '@react-navigation/core';
import MapView, { Marker } from 'react-native-maps';

const SPAuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigation = useNavigation();

  const handleToggle = () => setIsLogin(!isLogin);

  const handleLogin = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('Logged in with:', email);
      navigation.navigate('Main');
    } catch (error) {
      alert(`Login failed: ${error.message}`);
    }
  };

  const handleRegister = async ({ name, email, password, location, servicesOffered }) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const serviceProviderId = res.user.uid;

      // Save service provider details to Firestore
      await setDoc(doc(firestore, 'serviceProviders', serviceProviderId), {
        name,
        email,
        servicesOffered: servicesOffered.map((s) => s.service),
        prices: Object.fromEntries(servicesOffered.map((s) => [s.service, parseFloat(s.price)])),
        location: {
          address: 'Shop Address Placeholder',
          coordinates: location,
        },
        rating: 0,
        image: 'https://play-lh.googleusercontent.com/K95cb3vWHU_4lzeXlK8ZN6cTerPRmTl7I_Fx4Q0FlhebQnHNd0FS9NPQ6tdeIHoUSA',
      });

      console.log('Registered successfully:', name, email);
      alert('Registration successful!');
    } catch (error) {
      alert(`Sign Up Failed: ${error.message}`);
    }
  };

  return (
    <ScrollView>
      <View style={styles.container}>
        {/* Tab Buttons */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            onPress={handleToggle}
            style={isLogin ? styles.activeTab : styles.inactiveTab}
          >
            <Text style={styles.tabText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleToggle}
            style={!isLogin ? styles.activeTab : styles.inactiveTab}
          >
            <Text style={styles.tabText}>Register</Text>
          </TouchableOpacity>
        </View>

        {/* Render Forms */}
        {isLogin ? (
          <LoginForm onSubmit={handleLogin} />
        ) : (
          <RegisterForm onSubmit={handleRegister} />
        )}
      </View>
    </ScrollView>
  );
};

// Login Form Component
const LoginForm = ({ onSubmit }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={styles.formContainer}>
      <Text>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <Text>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Login" onPress={() => onSubmit(email, password)} />
    </View>
  );
};

// Register Form Component
const RegisterForm = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [servicesOffered, setServicesOffered] = useState([{ service: '', price: '' }]);
  const [location, setLocation] = useState(null);

  const handleAddService = () =>
    setServicesOffered([...servicesOffered, { service: '', price: '' }]);

  const handleUpdateService = (index, key, value) => {
    const updatedServices = [...servicesOffered];
    updatedServices[index][key] = value;
    setServicesOffered(updatedServices);
  };

  const handleMapPress = (event) => setLocation(event.nativeEvent.coordinate);

  const handleSubmit = () => {
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    onSubmit({ name, email, password, location, servicesOffered });
  };

  return (
    <View style={styles.formContainer}>
      <Text>Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <Text>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <Text>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Text>Confirm Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <Text>Services Offered</Text>
      {servicesOffered.map((service, index) => (
        <View key={index} style={{ flexDirection: 'row', marginBottom: 10 }}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 10 }]}
            placeholder="Service"
            value={service.service}
            onChangeText={(value) => handleUpdateService(index, 'service', value)}
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Price"
            keyboardType="numeric"
            value={service.price}
            onChangeText={(value) => handleUpdateService(index, 'price', value)}
          />
        </View>
      ))}
      <Button title="Add Service" onPress={handleAddService} />

      <Text>Location</Text>
      <MapView
        style={{ height: 200, marginVertical: 10 }}
        onPress={handleMapPress}
        initialRegion={{
          latitude: 37.7749,
          longitude: -122.4194,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {location && <Marker coordinate={location} />}
      </MapView>

      <Button title="Register" onPress={handleSubmit} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#f9f9f9',
    marginTop:50,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderColor: '#ddd',
  },
  activeTab: {
    flex: 1,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    alignItems: 'center',
  },
  inactiveTab: {
    flex: 1,
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    alignItems: 'center',
  },
  tabText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  formContainer: {
    marginBottom: 20,
  },
  input: {
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
});

export default SPAuthScreen;
