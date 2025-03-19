import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";


//Customer Screens
import HomeScreen from "./screens/Customer/HomeScreen";
import AuthScreen from "./screens/Customer/AuthScreen";
import ServiceProviderScreen from "./screens/Customer/ServiceProviderScreen";
import ProfileScreen from "./screens/Customer/ProfileScreen";
import EditProfileScreen from "./screens/Customer/EditProfile";

import PlaceOrderScreen from "./screens/Customer/PlaceOrderScreen";
import OrderScreen from "./screens/Customer/OrdersScreen";
import TrackOrderScreen from "./screens/Customer/TrackOrderScreen";
import CustomerFeedbackScreen from "./screens/Customer/RatingScreen";
import MapScreen from "./screens/Customer/MapScreen";
import FileComplaintScreen from "./screens/Customer/FileComplaint";

//Other Screens
import OnBoardingScreen from "./screens/OnBoardingScreen";
import LoadingScreen from "./screens/LoadingScreen";

//Service Provider Screens
import SPAuthScreen from "./screens/ServiceProvider/Auth";
import SPAccountDetails from "./screens/ServiceProvider/SPAccountDetails";
import SPServices from "./screens/ServiceProvider/SPServices";
import ServiceProviderOptions from "./screens/ServiceProvider/ServiceProviderOptions";
import ManageOrders from "./screens/ServiceProvider/ManageOrders";
import OrderDetailsScreen from "./screens/ServiceProvider/OrderDetailsScreen";

import { AddressProvider } from "./context/AddressContext"; // Import the Provider
import SPMapScreen from "./screens/ServiceProvider/SPMapScreen";
import ServiceProviderComplaints from "./screens/ServiceProvider/ManageComplaints";
import { OrderStatusProvider } from "./context/OrderStatusContext";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator for Main App Flow
const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === "Home") {
          iconName = focused ? "home" : "home-outline";
        } else if (route.name === "Account") {
          iconName = focused ? "person" : "person-outline";
        }
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: "#4CAF50",
      tabBarInactiveTintColor: "gray",
    })}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{ headerShown: false }}
    />
    <Tab.Screen
      name="Account"
      component={ProfileScreen}
      options={{ headerShown: false }}
    />
  </Tab.Navigator>
);

// Stack Navigator for App
export default function App() {
  return (
    <OrderStatusProvider>
    <AddressProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Loading">
          {/* Other Screens */}
          <Stack.Screen
            name="Loading"
            component={LoadingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="OnBoarding"
            component={OnBoardingScreen}
            options={{ headerShown: false }}
          />

          {/* Customer Screens */}
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Main"
            component={TabNavigator} // Tab Navigator as a screen
            options={{ headerShown: false }} // Hide header for Tab Navigator
          />

          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ServiceProviderScreen"
            component={ServiceProviderScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="OrderPlacement"
            component={PlaceOrderScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Orders"
            component={OrderScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Track"
            component={TrackOrderScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Rating"
            component={CustomerFeedbackScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="Map"
            component={MapScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ headerShown: false }}
          />

          {/* Service Provider Screens */}
          <Stack.Screen
            name="ServiceProviderAuth"
            component={SPAuthScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ManageOrders"
            component={ManageOrders}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ServiceProviderOptions"
            component={ServiceProviderOptions}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SPAccountDetails"
            component={SPAccountDetails}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SPServices"
            component={SPServices}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="OrderDetails"
            component={OrderDetailsScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="FileComplaint"
            component={FileComplaintScreen}
            options={{ headShown: false }}
          />

          <Stack.Screen
            name="SPMapScreen"
            component={SPMapScreen}
            options={{ headerShown: false }}
          />

          
          <Stack.Screen
            name="ManageComplaints"
            component={ServiceProviderComplaints}
            options={{ headerShown: false }}
          />

        </Stack.Navigator>
      </NavigationContainer>

    </AddressProvider>
    </OrderStatusProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
