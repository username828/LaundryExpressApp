import React, { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { MaterialIcons, FontAwesome5, Entypo } from "@expo/vector-icons";

const steps = [
  { label: "Order Confirmed", icon: <MaterialIcons name="check-circle" size={24} color="white" /> },
  { label: "Picked Up", icon: <FontAwesome5 name="shopping-bag" size={20} color="white" /> },
  { label: "In Progress", icon: <MaterialIcons name="local-laundry-service" size={24} color="white" /> },
  { label: "Dispatched", icon: <Entypo name="truck" size={24} color="white" /> },
  { label: "Delivered", icon: <FontAwesome5 name="box" size={20} color="white" /> },
];

const Status = () => {
  const [activeStep, setActiveStep] = useState(1); // Track the current active step

  return (
    <View style={styles.container}>
      <View style={styles.stepsContainer}>
        {steps.map((step, index) => (
          <View key={index} style={styles.stepContainer}>
            {/* Step Circle */}
            <View
              style={[
                styles.circle,
                { backgroundColor: index < activeStep ? "#4CAF50" : "#D3D3D3" },
              ]}
            >
              {step.icon}
            </View>
            {/* Step Line */}
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.line,
                  { backgroundColor: index < activeStep - 1 ? "#4CAF50" : "#D3D3D3" },
                ]}
              />
            )}
            {/* Step Label */}
            <Text
              style={[
                styles.label,
                { color: index < activeStep ? "#000" : "#7F7F7F" },
              ]}
            >
              {step.label}
            </Text>
          </View>
        ))}
      </View>
      {/* Next Step Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => setActiveStep((prev) => Math.min(prev + 1, steps.length))}
      >
        <Text style={styles.buttonText}>Next Step</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Status;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F9F9F9",
  },
  stepsContainer: {
    width: "100%",
    alignItems: "center",
    padding: 20,
  },
  stepContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  line: {
    width: 4,
    height: 60,
    backgroundColor: "#D3D3D3",
  },
  label: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: "500",
  },
  button: {
    marginTop: 50,
    height: 50,
    width: 200,
    backgroundColor: "#FFA500",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    alignSelf: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
