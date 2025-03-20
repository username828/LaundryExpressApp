/**
 * LaundryExpress App Theme
 *
 * This file contains the design system for the LaundryExpress app,
 * including colors, typography, spacing, and component styles.
 */

// Color Palette
export const COLORS = {
  // Primary colors
  primary: "#2A2A5A", // Deep blue/purple
  primaryLight: "#3E3E7A",
  primaryDark: "#1A1A40",

  // Secondary colors - for accents and CTAs
  secondary: "#FF6B3D", // Orange
  secondaryLight: "#FF8C6A",
  secondaryDark: "#E85A2C",

  // UI colors
  background: "#FFFFFF",
  backgroundLight: "#F5F7FA",
  card: "#FFFFFF",

  // Status colors
  success: "#4CAF50", // Green for success states
  warning: "#FFC107", // Amber for warnings
  error: "#FF3B30", // Red for errors
  info: "#2196F3", // Blue for information

  // Text colors
  textPrimary: "#333333",
  textSecondary: "#757575",
  textTertiary: "#9E9E9E",
  textLight: "#FFFFFF",

  // Border colors
  border: "#E0E0E0",
  borderLight: "#F0F0F0",

  // Other UI elements
  divider: "#EEEEEE",
  shadow: "rgba(0, 0, 0, 0.1)",
  overlay: "rgba(0, 0, 0, 0.5)",

  // Specific components
  inputBackground: "#F5F7FA",
  placeholder: "#BDBDBD",
};

// Typography
export const TYPOGRAPHY = {
  // Font weights
  fontWeightLight: "300",
  fontWeightRegular: "400",
  fontWeightMedium: "500",
  fontWeightSemiBold: "600",
  fontWeightBold: "700",

  // Font sizes
  fontSizeXS: 12,
  fontSizeSmall: 14,
  fontSizeMedium: 16,
  fontSizeLarge: 18,
  fontSizeXL: 20,
  fontSizeXXL: 24,
  fontSizeHeading: 28,
  fontSizeDisplay: 32,

  // Line heights
  lineHeightTight: 1.2,
  lineHeightNormal: 1.5,
  lineHeightRelaxed: 1.8,

  // Letter spacing
  letterSpacingTight: -0.5,
  letterSpacingNormal: 0,
  letterSpacingWide: 0.5,
};

// Spacing system
export const SPACING = {
  tiny: 4,
  small: 8,
  medium: 16,
  large: 24,
  xLarge: 32,
  xxLarge: 48,

  // Layout specific
  screenPadding: 16,
  sectionMargin: 24,
  cardPadding: 16,
  inputPadding: 12,
  buttonPadding: 16,
};

// Border radius
export const BORDER_RADIUS = {
  small: 4,
  medium: 8,
  large: 12,
  xLarge: 16,
  pill: 50,
  circle: 9999,
};

// Shadows
export const SHADOWS = {
  small: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  medium: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3.0,
    elevation: 3,
  },
  large: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 5.46,
    elevation: 5,
  },
};

// Component styles
export const COMPONENTS = {
  // Button styles
  button: {
    primary: {
      backgroundColor: COLORS.primary,
      color: COLORS.textLight,
      borderRadius: BORDER_RADIUS.large,
      paddingVertical: SPACING.buttonPadding,
      paddingHorizontal: SPACING.large,
      ...SHADOWS.medium,
    },
    secondary: {
      backgroundColor: COLORS.secondary,
      color: COLORS.textLight,
      borderRadius: BORDER_RADIUS.large,
      paddingVertical: SPACING.buttonPadding,
      paddingHorizontal: SPACING.large,
      ...SHADOWS.medium,
    },
    outline: {
      backgroundColor: COLORS.background,
      color: COLORS.primary,
      borderRadius: BORDER_RADIUS.large,
      borderWidth: 1,
      borderColor: COLORS.primary,
      paddingVertical: SPACING.buttonPadding,
      paddingHorizontal: SPACING.large,
    },
    disabled: {
      backgroundColor: COLORS.borderLight,
      color: COLORS.textTertiary,
      borderRadius: BORDER_RADIUS.large,
      paddingVertical: SPACING.buttonPadding,
      paddingHorizontal: SPACING.large,
    },
  },

  // Card styles
  card: {
    standard: {
      backgroundColor: COLORS.card,
      borderRadius: BORDER_RADIUS.large,
      padding: SPACING.cardPadding,
      ...SHADOWS.small,
    },
    elevated: {
      backgroundColor: COLORS.card,
      borderRadius: BORDER_RADIUS.large,
      padding: SPACING.cardPadding,
      ...SHADOWS.medium,
    },
    flat: {
      backgroundColor: COLORS.card,
      borderRadius: BORDER_RADIUS.large,
      padding: SPACING.cardPadding,
      borderWidth: 1,
      borderColor: COLORS.borderLight,
    },
  },

  // Input styles
  input: {
    standard: {
      backgroundColor: COLORS.inputBackground,
      borderRadius: BORDER_RADIUS.medium,
      paddingVertical: SPACING.inputPadding,
      paddingHorizontal: SPACING.medium,
      borderWidth: 1,
      borderColor: COLORS.border,
      color: COLORS.textPrimary,
    },
    focused: {
      backgroundColor: COLORS.inputBackground,
      borderRadius: BORDER_RADIUS.medium,
      paddingVertical: SPACING.inputPadding,
      paddingHorizontal: SPACING.medium,
      borderWidth: 1,
      borderColor: COLORS.primary,
      color: COLORS.textPrimary,
    },
    error: {
      backgroundColor: COLORS.inputBackground,
      borderRadius: BORDER_RADIUS.medium,
      paddingVertical: SPACING.inputPadding,
      paddingHorizontal: SPACING.medium,
      borderWidth: 1,
      borderColor: COLORS.error,
      color: COLORS.textPrimary,
    },
  },

  // Header styles
  header: {
    backgroundColor: COLORS.background,
    height: 60,
    paddingHorizontal: SPACING.screenPadding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    ...SHADOWS.small,
  },

  // Tab styles
  tab: {
    backgroundColor: COLORS.background,
    height: 48,
    indicatorColor: COLORS.primary,
  },

  // Service card (from the mockup)
  serviceCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.medium,
    marginRight: SPACING.medium,
    width: 110,
    height: 110,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.small,
  },

  // Quantity control (for the cart)
  quantityControl: {
    container: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: BORDER_RADIUS.medium,
      borderWidth: 1,
      borderColor: COLORS.border,
      overflow: "hidden",
    },
    button: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: COLORS.backgroundLight,
    },
    text: {
      width: 36,
      textAlign: "center",
      backgroundColor: COLORS.background,
    },
  },

  // Cart item
  cartItem: {
    container: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: SPACING.medium,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.borderLight,
    },
    content: {
      flex: 1,
      marginHorizontal: SPACING.medium,
    },
  },
};

// Export the theme
export default {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  COMPONENTS,
};
