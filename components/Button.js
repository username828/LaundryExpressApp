import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

/**
 * Button Component
 *
 * @param {Object} props
 * @param {string} props.title - Button text
 * @param {string} props.variant - 'primary', 'secondary', 'outline', 'error'
 * @param {string} props.size - 'small', 'medium', 'large'
 * @param {function} props.onPress - Function to call on button press
 * @param {boolean} props.disabled - Is the button disabled
 * @param {boolean} props.loading - Show loading indicator
 * @param {string} props.icon - Icon name from Ionicons
 * @param {Object} props.style - Additional styles for the button
 */
const Button = ({
  title,
  variant = "primary",
  size = "medium",
  onPress,
  disabled = false,
  loading = false,
  icon,
  style,
  ...props
}) => {
  const theme = useTheme();

  // Determine button style based on variant and disabled state
  const getButtonStyle = () => {
    if (disabled) {
      return {
        backgroundColor: theme.colors.borderLight,
        borderColor: theme.colors.border,
      };
    }

    switch (variant) {
      case "secondary":
        return {
          backgroundColor: theme.colors.secondary,
          borderColor: theme.colors.secondaryDark,
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderColor: theme.colors.primary,
          borderWidth: 1,
        };
      case "error":
        return {
          backgroundColor: theme.colors.error,
          borderColor: theme.colors.error,
        };
      case "primary":
      default:
        return {
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primaryDark,
        };
    }
  };

  // Get text color based on button variant
  const getTextColor = () => {
    if (disabled) {
      return theme.colors.textTertiary;
    }

    switch (variant) {
      case "outline":
        return theme.colors.primary;
      case "primary":
      case "secondary":
      case "error":
      default:
        return theme.colors.textLight;
    }
  };

  // Determine button size
  const getButtonSize = () => {
    switch (size) {
      case "small":
        return {
          paddingVertical: 8,
          paddingHorizontal: 12,
        };
      case "large":
        return {
          paddingVertical: 16,
          paddingHorizontal: 24,
        };
      case "medium":
      default:
        return {
          paddingVertical: 12,
          paddingHorizontal: 16,
        };
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, getButtonStyle(), getButtonSize(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <View style={styles.buttonContent}>
          {icon && (
            <Ionicons
              name={icon}
              size={size === "small" ? 16 : 20}
              color={getTextColor()}
              style={styles.icon}
            />
          )}
          <Text
            style={[
              styles.text,
              { color: getTextColor() },
              size === "small" && styles.smallText,
              size === "large" && styles.largeText,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  smallText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 18,
  },
  icon: {
    marginRight: 8,
  },
});

export default Button;
