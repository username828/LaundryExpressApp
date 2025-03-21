import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../theme/ThemeContext";

const ServiceProviderOptions = () => {
  const navigation = useNavigation();
  const theme = useTheme();

  const handleAccountDetails = () => {
    navigation.navigate("SPAccountDetails");
  };

  const handleServices = () => {
    navigation.navigate("SPServices");
  };

  const handleManageOrders = () => {
    navigation.navigate("ManageOrders");
  };

  const handleManageComplaints = () => {
    navigation.navigate("ManageComplaints");
  };

  const handleViewAnalytics = () => {
    navigation.navigate("SPAnalytics");
  };

  const options = [
    {
      title: "Account Details",
      icon: "person-circle-outline",
      onPress: handleAccountDetails,
    },
    {
      title: "Services",
      icon: "list-outline",
      onPress: handleServices,
    },
    {
      title: "Manage Orders",
      icon: "cart-outline",
      onPress: handleManageOrders,
    },
    {
      title: "Manage Complaints",
      icon: "chatbox-ellipses-outline",
      onPress: handleManageComplaints,
    },
    {
      title: "View Analytics",
      icon: "bar-chart-outline",
      onPress: handleViewAnalytics,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.iconCircle}>
            <Ionicons name="business-outline" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>Service Provider Dashboard</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Manage Your Business</Text>

        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.optionCard}
            onPress={option.onPress}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.colors.primary + "15" },
              ]}
            >
              <Ionicons
                name={option.icon}
                size={24}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>{option.title}</Text>
            </View>
            <Ionicons
              name="chevron-forward-outline"
              size={22}
              color={theme.colors.textLight}
            />
          </TouchableOpacity>
        ))}

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Laundry Express Business Portal</Text>
          <TouchableOpacity style={styles.helpButton}>
            <Text style={styles.helpButtonText}>Need help?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    alignItems: "center",
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
    color: "#333333",
    paddingLeft: 4,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  footerContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#999999",
    marginBottom: 12,
  },
  helpButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  helpButtonText: {
    color: "#666666",
    fontSize: 14,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
});

export default ServiceProviderOptions;
