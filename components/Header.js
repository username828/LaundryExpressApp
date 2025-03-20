import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Header Component
 *
 * @param {Object} props
 * @param {string} props.title - Header title
 * @param {string} props.leftIcon - Icon name for left button
 * @param {function} props.onLeftPress - Function to call when left button is pressed
 * @param {string} props.rightIcon - Icon name for right button
 * @param {function} props.onRightPress - Function to call when right button is pressed
 * @param {Object} props.style - Additional styles for the header
 */
const Header = ({
  title,
  leftIcon,
  onLeftPress,
  rightIcon,
  onRightPress,
  style,
  ...props
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.colors.background,
          paddingTop: Math.max(insets.top, theme.spacing.medium),
          borderBottomColor: theme.colors.borderLight,
          shadowColor: theme.colors.shadow,
        },
        style,
      ]}
      {...props}
    >
      <View style={styles.leftContainer}>
        {leftIcon && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onLeftPress}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons name={leftIcon} size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>

      <View style={styles.rightContainer}>
        {rightIcon ? (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onRightPress}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons name={rightIcon} size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    height: 60,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  leftContainer: {
    flexDirection: "row",
    width: 40,
    alignItems: "center",
  },
  rightContainer: {
    flexDirection: "row",
    width: 40,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  iconButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  placeholder: {
    width: 24,
  },
});

export default Header;
