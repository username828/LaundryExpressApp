import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, firestore } from "../../firebaseConfig";
import { useNavigation } from "@react-navigation/core";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../theme/ThemeContext";

const { width, height } = Dimensions.get("window");

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigation = useNavigation();
  const tabIndicatorPosition = useRef(new Animated.Value(0)).current;
  const theme = useTheme();

  const handleToggle = () => {
    setIsLogin(!isLogin);

    // Animate tab indicator
    Animated.spring(tabIndicatorPosition, {
      toValue: isLogin ? 1 : 0,
      friction: 8,
      tension: 50,
      useNativeDriver: true,
    }).start();
  };

  // Update the tab indicator on initial render
  useEffect(() => {
    Animated.spring(tabIndicatorPosition, {
      toValue: isLogin ? 0 : 1,
      friction: 8,
      tension: 50,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLogin = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Logged in with:", email);
      navigation.navigate("Main");
    } catch (error) {
      alert(`Login failed: ${error.message}`);
    }
  };

  const handleRegister = async (name, email, password) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const userId = res.user.uid;

      // Save user details to Firestore
      await setDoc(doc(firestore, "customers", userId), {
        name,
        email,
        rating: 0,
        createdAt: new Date(),
      });

      console.log("Registered successfully:", name, email);
      alert("Registration successful!");
      navigation.navigate("Main");
    } catch (error) {
      alert(`Sign Up Failed: ${error.message}`);
    }
  };

  // Calculate tab indicator position
  const translateX = tabIndicatorPosition.interpolate({
    inputRange: [0, 1.19],
    outputRange: [4, width * 0.5 + 4],
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={styles.headerGradient}
      >
        <View style={styles.logoContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="water" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.logo}>Laundry Express</Text>
          <Text style={styles.logoTagline}>Customer Portal</Text>
        </View>
      </LinearGradient>
      <View style={styles.contentContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.tabContainerWrapper}>
            <View style={styles.tabContainer}>
              <Animated.View
                style={[
                  styles.tabIndicator,
                  { transform: [{ translateX }] },
                  { backgroundColor: theme.colors.background },
                ]}
              />
              <TouchableOpacity
                onPress={() => !isLogin && handleToggle()}
                style={styles.tab}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabText,
                    isLogin && {
                      color: theme.colors.primary,
                      fontWeight: "700",
                    },
                  ]}
                >
                  Login
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => isLogin && handleToggle()}
                style={styles.tab}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabText,
                    !isLogin && {
                      color: theme.colors.primary,
                      fontWeight: "700",
                    },
                  ]}
                >
                  Register
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {isLogin ? (
            <LoginForm onSubmit={handleLogin} theme={theme} />
          ) : (
            <RegisterForm onSubmit={handleRegister} theme={theme} />
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const InputField = ({ label, icon, isPassword, theme, ...props }) => {
  const [secureTextEntry, setSecureTextEntry] = useState(isPassword);
  const [isFocused, setIsFocused] = useState(false);

  const toggleSecureEntry = () => {
    setSecureTextEntry(!secureTextEntry);
  };

  return (
    <View style={styles.inputContainer}>
      <View
        style={[
          styles.inputWrapper,
          isFocused && { borderColor: theme?.colors.primary },
        ]}
      >
        <View style={styles.inputRow}>
          <Ionicons
            name={icon}
            size={20}
            color={isFocused ? theme?.colors.primary : "#666"}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.inputWithIcon}
            placeholderTextColor={theme?.colors.primary + "99"}
            secureTextEntry={secureTextEntry}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          {isPassword && (
            <TouchableOpacity
              onPress={toggleSecureEntry}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={secureTextEntry ? "eye-outline" : "eye-off-outline"}
                size={20}
                color={isFocused ? theme?.colors.primary : "#666"}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const LoginForm = ({ onSubmit, theme }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleForgotPassword = async () => {
    if (!email) {
      alert("Please enter your email address first");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent! Please check your inbox.");
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <View style={styles.formContainer}>
      <InputField
        label="Email"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        icon="mail-outline"
        theme={theme}
      />
      <InputField
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        isPassword={true}
        icon="lock-closed-outline"
        theme={theme}
      />
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
        onPress={() => onSubmit(email, password)}
        activeOpacity={0.9}
      >
        <View style={styles.buttonContent}>
          <Ionicons
            name="log-in-outline"
            size={20}
            color="#FFFFFF"
            style={styles.buttonIcon}
          />
          <Text style={styles.buttonText}>Sign In</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={handleForgotPassword}
        style={styles.forgotPasswordContainer}
        activeOpacity={0.7}
      >
        <Text
          style={[styles.forgotPasswordText, { color: theme.colors.primary }]}
        >
          Forgot Password?
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const RegisterForm = ({ onSubmit, theme }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    onSubmit(name, email, password);
  };

  return (
    <View style={styles.formContainer}>
      <InputField
        label="Name"
        placeholder="Enter your full name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        icon="person-outline"
        theme={theme}
      />
      <InputField
        label="Email"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        icon="mail-outline"
        theme={theme}
      />
      <InputField
        label="Password"
        placeholder="Create a password"
        value={password}
        onChangeText={setPassword}
        isPassword={true}
        icon="lock-closed-outline"
        theme={theme}
      />
      <InputField
        label="Confirm Password"
        placeholder="Confirm your password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        isPassword={true}
        icon="lock-closed-outline"
        theme={theme}
      />
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
        onPress={handleSubmit}
        activeOpacity={0.9}
      >
        <View style={styles.buttonContent}>
          <Ionicons
            name="person-add-outline"
            size={20}
            color="#FFFFFF"
            style={styles.buttonIcon}
          />
          <Text style={styles.buttonText}>Create Account</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  headerGradient: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  logo: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
  },
  logoTagline: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  tabContainerWrapper: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    padding: 4,
    width: "100%",
    position: "relative",
    height: 52,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2.5,
    elevation: 1,
  },
  tabIndicator: {
    position: "absolute",
    height: 44,
    width: "50%",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    left: 4,
    top: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tab: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    zIndex: 1,
    height: 44,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666666",
  },
  formContainer: {
    marginTop: 0,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#f9f9f9",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
  },
  inputIcon: {
    paddingLeft: 16,
    width: 46,
    textAlign: "center",
  },
  inputWithIcon: {
    flex: 1,
    height: 56,
    paddingHorizontal: 12,
    fontSize: 15,
    color: "#333333",
  },
  eyeIcon: {
    padding: 10,
    paddingRight: 16,
  },
  button: {
    height: 56,
    borderRadius: 12,
    marginTop: 24,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
    overflow: "hidden",
  },
  buttonContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  forgotPasswordContainer: {
    alignItems: "center",
    marginTop: 20,
    paddingVertical: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default AuthScreen;
