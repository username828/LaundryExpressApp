import { StyleSheet } from "react-native";
import HomeScreen from "./screens/HomeScreen";
import AuthScreen from "./screens/AuthScreen";
import ServiceProviderScreen from "./screens/ServiceProviderScreen";
import ProfileScreen from "./screens/ProfileScreen";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import PlaceOrderScreen from "./screens/PlaceOrderScreen";
import OnBoardingScreen from "./screens/OnBoardingScreen";
import OrderScreen from "./screens/OrdersScreen";
import SPAuthScreen from "./screens/ServiceProvider/Auth";
import TrackOrderScreen from "./screens/TrackOrderScreen";
import CustomerFeedbackScreen from "./screens/RatingScreen";
import LoadingScreen from "./screens/LoadingScreen"; // Import LoadingScreen
import ServiceProviderOptions from "./screens/ServiceProvider/ServiceProviderOptions"; // Import ServiceProviderOptions
import { auth, db } from "./firebaseConfig"; // Adjust the path if necessary

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
      tabBarActiveTintColor: "blue",
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
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Loading">
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
          name="ServiceProviderAuth"
          component={SPAuthScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ServiceProviderOptions"
          component={ServiceProviderOptions}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
