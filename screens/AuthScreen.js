import { signInWithEmailAndPassword,createUserWithEmailAndPassword, signInWithPhoneNumber } from 'firebase/auth';
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { auth } from '../firebaseConfig';
import { NavigationContainer } from '@react-navigation/native';
import { addCustomer } from '../helpers/data';
const AuthScreen = ({navigation}) => {
  // State to manage whether we're showing the login or register form
  const [isLogin, setIsLogin] = useState(true);
  const fbauth=auth;
  const handleToggle = () => {
    setIsLogin(!isLogin); // Toggle between login and register
  };

  const handleLogin = async (email, password) => {
    // Placeholder for login logic (e.g., Firebase Authentication)
    try{
      const res=await signInWithEmailAndPassword(fbauth,email,password)
      
      console.log("Logging in with:", email, password);
      navigation.navigate('Main'); // Navigate to the TabNavigator
    } catch(error){
      alert(`Login failed: ${error.message}`)
    }
  };
  

  const handleRegister = async (name,email, password) => {
    try{
      const res=await createUserWithEmailAndPassword(fbauth, email, password);
      const uid=res.user.uid
      console.log(uid)
      // Placeholder for registration logic (e.g., Firebase Authentication)
      await addCustomer(name,email,password,uid)
      console.log("Registering with:", email, password);
    } catch(error){
      alert(`Sign Up Failed: ${error.message}`);
    }

  };

  return (
    <View style={styles.container}>
      {/* Tab Buttons for Switching Between Login and Register */}
      <View style={styles.tabContainer}>
        <TouchableOpacity onPress={handleToggle} style={isLogin ? styles.activeTab : styles.inactiveTab}>
          <Text style={styles.tabText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleToggle} style={!isLogin ? styles.activeTab : styles.inactiveTab}>
          <Text style={styles.tabText}>Register</Text>
        </TouchableOpacity>
      </View>

      {/* Render Login or Register Form Based on Tab */}
      {isLogin ? (
        <LoginForm onSubmit={handleLogin} />
      ) : (
        <RegisterForm onSubmit={handleRegister} />
      )}
    </View>
  );
};

// Login Form Component
const LoginForm = ({ onSubmit }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNum,setPhoneNum]=useState('');


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
      <Button title="Register" onPress={() => onSubmit(name,email, password)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#f9f9f9',
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

export default AuthScreen;
