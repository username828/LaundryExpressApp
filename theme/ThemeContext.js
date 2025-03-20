import React, { createContext, useContext } from "react";
import themeConstants from "./theme";

// Restructure theme for easier component access
const theme = {
  colors: themeConstants.COLORS,
  typography: themeConstants.TYPOGRAPHY,
  spacing: themeConstants.SPACING,
  borderRadius: themeConstants.BORDER_RADIUS,
  shadows: themeConstants.SHADOWS,
  components: themeConstants.COMPONENTS,
};

// Create a Theme Context
const ThemeContext = createContext(theme);

// Create a Theme Provider component
export const ThemeProvider = ({ children }) => {
  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
};

// Create a custom hook to access the theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export default ThemeContext;
