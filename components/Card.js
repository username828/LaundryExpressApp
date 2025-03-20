import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";

/**
 * Card Component
 *
 * @param {Object} props
 * @param {string} props.variant - 'standard', 'elevated', 'flat'
 * @param {Object} props.style - Additional styles for the card
 */
const Card = ({ children, variant = "standard", style, ...props }) => {
  const theme = useTheme();

  // Determine card style based on variant
  const getCardStyle = () => {
    switch (variant) {
      case "elevated":
        return {
          backgroundColor: theme.colors.card,
          borderRadius: theme.borderRadius.large,
          padding: theme.spacing.medium,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 3,
          elevation: 3,
        };
      case "flat":
        return {
          backgroundColor: theme.colors.card,
          borderRadius: theme.borderRadius.large,
          padding: theme.spacing.medium,
          borderWidth: 1,
          borderColor: theme.colors.borderLight,
        };
      case "standard":
      default:
        return {
          backgroundColor: theme.colors.card,
          borderRadius: theme.borderRadius.large,
          padding: theme.spacing.medium,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.18,
          shadowRadius: 1,
          elevation: 1,
        };
    }
  };

  return (
    <View style={[styles.card, getCardStyle(), style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "100%",
  },
});

export default Card;
