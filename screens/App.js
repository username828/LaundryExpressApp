import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import LoadingScreen from "./LoadingScreen"; // Ensure this import is correct
import OnboardingScreen from "./OnboardingScreen"; // Adjust as necessary
import AuthScreen from "./ServiceProvider/Auth";
import ServiceProviderOptions from "./screens/ServiceProvider/ServiceProviderOptions";

const Stack = createStackNavigator();

// const App = () => {
//   return (
//     <NavigationContainer>
//       <Stack.Navigator initialRouteName="Auth">
//         <Stack.Screen name="Auth" component={AuthScreen} />
//         <Stack.Screen
//           name="ServiceProviderOptions"
//           component={ServiceProviderOptions}
//         />
//         {/* Add other screens here */}
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// };

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Loading">
        <Stack.Screen
          name="LoadingScreen"
          component={LoadingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen
          name="ServiceProviderOptions"
          component={ServiceProviderOptions}
        />
        {/* Add other screens here */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
