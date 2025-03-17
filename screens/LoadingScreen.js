import React, { useEffect } from "react";
import { View, Image, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import OnboardingScreen from "./OnBoardingScreen";
const LoadingScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("OnBoarding"); // Navigate to the onboarding screen after 2 seconds
    }, 2000); // 2000 milliseconds = 2 seconds

    return () => clearTimeout(timer); // Cleanup the timer on unmount
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/LoadingScreen.png")} // Ensure this path is correct
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  image: {
    width: 820, // Adjust width as needed
    height: 820, // Adjust height as needed
  },
});

export default LoadingScreen;