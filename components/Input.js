import React, { useState } from "react";
import { View, TextInput, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

/**
 * Input Component
 *
 * @param {Object} props
 * @param {string} props.label - Input label
 * @param {string} props.placeholder - Input placeholder
 * @param {function} props.onChangeText - Function to call on text change
 * @param {string} props.value - Input value
 * @param {boolean} props.error - Whether there's an error
 * @param {string} props.errorText - Error message
 * @param {string} props.leftIcon - Ionicons icon name for left icon
 * @param {string} props.rightIcon - Ionicons icon name for right icon
 * @param {Object} props.style - Additional styles for the container
 * @param {Object} props.inputStyle - Additional styles for the input
 */
const Input = ({
  label,
  placeholder,
  onChangeText,
  value,
  error = false,
  errorText,
  leftIcon,
  rightIcon,
  style,
  inputStyle,
  ...props
}) => {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  // Determine input style based on state
  const getInputStyle = () => {
    if (error) {
      return {
        backgroundColor: theme.colors.inputBackground,
        borderColor: theme.colors.error,
      };
    }

    if (isFocused) {
      return {
        backgroundColor: theme.colors.inputBackground,
        borderColor: theme.colors.primary,
      };
    }

    return {
      backgroundColor: theme.colors.inputBackground,
      borderColor: theme.colors.border,
    };
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text
          style={[
            styles.label,
            { color: error ? theme.colors.error : theme.colors.text },
          ]}
        >
          {label}
        </Text>
      )}

      <View style={styles.inputWrapper}>
        {leftIcon && (
          <View style={styles.leftIcon}>
            <Ionicons
              name={leftIcon}
              size={20}
              color={
                error
                  ? theme.colors.error
                  : isFocused
                  ? theme.colors.primary
                  : theme.colors.textSecondary
              }
            />
          </View>
        )}

        <TextInput
          style={[
            styles.input,
            {
              borderRadius: theme.borderRadius.medium,
              paddingVertical: theme.spacing.small,
              paddingHorizontal: theme.spacing.medium,
              borderWidth: 1,
              color: theme.colors.text,
            },
            getInputStyle(),
            leftIcon && { paddingLeft: 40 },
            rightIcon && { paddingRight: 40 },
            inputStyle,
          ]}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.placeholder}
          onChangeText={onChangeText}
          value={value}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {rightIcon && (
          <View style={styles.rightIcon}>
            <Ionicons
              name={rightIcon}
              size={20}
              color={
                error
                  ? theme.colors.error
                  : isFocused
                  ? theme.colors.primary
                  : theme.colors.textSecondary
              }
            />
          </View>
        )}
      </View>

      {error && errorText && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {errorText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  inputWrapper: {
    position: "relative",
    width: "100%",
  },
  input: {
    fontSize: 16,
    width: "100%",
  },
  leftIcon: {
    position: "absolute",
    left: 12,
    top: "50%",
    zIndex: 1,
    transform: [{ translateY: -10 }],
  },
  rightIcon: {
    position: "absolute",
    right: 12,
    top: "50%",
    zIndex: 1,
    transform: [{ translateY: -10 }],
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default Input;
