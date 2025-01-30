import { useNavigation } from "@react-navigation/core";
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const OnboardingScreen = () => {
    const navigation=useNavigation()
  return (

    <ImageBackground
      source={require("../assets/logo.png")} // Replace with your background image path
      style={styles.background}
      resizeMode="cover" // Ensures the image covers the entire screen
    >
      <View style={styles.overlay}>
        {/* App Name */}
        <Text style={styles.appName}>Laundry Express</Text>

        {/* Buttons */}
        <TouchableOpacity
          style={[styles.button, styles.customerButton]}
          onPress={() => navigation.navigate("Auth")}
        >
          <Text style={styles.buttonText}>Continue as Customer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.providerButton]}
          onPress={() => navigation.navigate("ServiceProviderAuth")}
        >
          <Text style={styles.buttonText}>Continue as Service Provider</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1, // Ensures the image covers the entire screen
    justifyContent: "center", // Centers content vertically
    alignItems: "center", // Centers content horizontally
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
     // Semi-transparent overlay for readability
  },
  appName: {
    fontSize: 36,
    fontWeight: "bold",
    color: "white", // White text for contrast
    marginBottom: 20,
    textAlign: "center",
    fontFamily: "sans-serif-medium",
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 40,
  },
  button: {
    width: "80%",
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderRadius: 30,
    marginVertical: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 5,
  },
  customerButton: {
    backgroundColor: "#4CAF50", // Green button
  },
  providerButton: {
    backgroundColor: "#2196F3", // Blue button
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
