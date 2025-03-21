import { useNavigation } from "@react-navigation/core";
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";

const { width, height } = Dimensions.get("window");

const OnboardingScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={styles.background}
      >
        <View style={styles.contentContainer}>
          <View style={styles.logoContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="water" size={60} color="#FFFFFF" />
            </View>
            <Text style={styles.appName}>Laundry Express</Text>
            <Text style={styles.tagline}>
              Laundry Services at your Doorstep
            </Text>
          </View>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={() => navigation.navigate("Auth")}
            >
              <Ionicons
                name="person-outline"
                size={24}
                color="#FFFFFF"
                style={styles.buttonIcon}
              />
              <Text style={styles.primaryButtonText}>Continue as Customer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => navigation.navigate("ServiceProviderAuth")}
            >
              <Ionicons
                name="business-outline"
                size={24}
                color={theme.colors.primary}
                style={styles.buttonIcon}
              />
              <Text style={styles.secondaryButtonText}>
                Continue as Service Provider
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.learnMoreButton}>
              <Text style={styles.learnMoreText}>
                Learn more about our services
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    paddingTop: height * 0.15,
    paddingBottom: height * 0.05,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
    marginTop: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  appName: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 8,
    textAlign: "center",
  },
  buttonsContainer: {
    width: "100%",
    marginTop: "auto",
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    marginBottom: 24,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },
  buttonIcon: {
    marginRight: 12,
  },
  learnMoreButton: {
    padding: 8,
    alignItems: "center",
  },
  learnMoreText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});

export default OnboardingScreen;
