import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

/**
 * QuantityControl Component
 *
 * @param {Object} props
 * @param {number} props.value - Current quantity value
 * @param {function} props.onIncrease - Function to call when increasing quantity
 * @param {function} props.onDecrease - Function to call when decreasing quantity
 * @param {number} props.min - Minimum allowed value (default: 0)
 * @param {number} props.max - Maximum allowed value (default: 99)
 * @param {Object} props.style - Additional styles for the container
 */
const QuantityControl = ({
  value,
  onIncrease,
  onDecrease,
  min = 0,
  max = 99,
  style,
  ...props
}) => {
  const theme = useTheme();

  const handleDecrease = () => {
    if (value > min) {
      onDecrease();
    }
  };

  const handleIncrease = () => {
    if (value < max) {
      onIncrease();
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: theme.borderRadius.medium,
          borderColor: theme.colors.border,
          borderWidth: 1,
        },
        style,
      ]}
      {...props}
    >
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: theme.colors.backgroundLight },
        ]}
        onPress={handleDecrease}
        disabled={value <= min}
      >
        <Ionicons
          name="remove"
          size={18}
          color={
            value <= min ? theme.colors.textTertiary : theme.colors.textPrimary
          }
        />
      </TouchableOpacity>

      <View
        style={[
          styles.valueContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text style={[styles.value, { color: theme.colors.text }]}>
          {value}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: theme.colors.backgroundLight },
        ]}
        onPress={handleIncrease}
        disabled={value >= max}
      >
        <Ionicons
          name="add"
          size={18}
          color={
            value >= max ? theme.colors.textTertiary : theme.colors.textPrimary
          }
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: 32,
    overflow: "hidden",
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: "100%",
  },
  valueContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: "100%",
  },
  value: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
});

export default QuantityControl;
