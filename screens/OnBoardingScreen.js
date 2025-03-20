import { useNavigation } from "@react-navigation/core";
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { collection, query, where, onSnapshot } from "firebase/firestore";

const OnboardingScreen = () => {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <Text style={styles.appName}>Laundry Express</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Auth")}
      >
        <Text style={styles.buttonText}>Continue as Customer</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("ServiceProviderAuth")}
      >
        <Text style={styles.buttonText}>Continue as Service Provider</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#333333", // Dark grey background color
    padding: 20,
  },
  appName: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#ffffff", // White text for contrast
    marginBottom: 40,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#444444", // Subtle shade of dark grey for buttons
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: "center",
    marginVertical: 10, // Spacing between buttons
    width: "100%", // Full width for buttons
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default OnboardingScreen;
