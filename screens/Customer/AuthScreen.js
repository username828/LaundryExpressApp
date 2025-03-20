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

const { width, height } = Dimensions.get("window");

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigation = useNavigation();
  const tabIndicatorPosition = useRef(new Animated.Value(0)).current;

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
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.gradient}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>Laundry Express</Text>
            <Text style={styles.logoTagline}>Customer Portal</Text>
          </View>

          <View style={styles.tabContainerWrapper}>
            <View style={styles.tabContainer}>
              <Animated.View
                style={[styles.tabIndicator, { transform: [{ translateX }] }]}
              />
              <TouchableOpacity
                onPress={() => !isLogin && handleToggle()}
                style={styles.tab}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, isLogin && styles.activeTabText]}>
                  Login
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => isLogin && handleToggle()}
                style={styles.tab}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.tabText, !isLogin && styles.activeTabText]}
                >
                  Register
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {isLogin ? (
            <LoginForm onSubmit={handleLogin} />
          ) : (
            <RegisterForm onSubmit={handleRegister} />
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const InputField = ({ label, icon, isPassword, ...props }) => {
  const [secureTextEntry, setSecureTextEntry] = useState(isPassword);

  const toggleSecureEntry = () => {
    setSecureTextEntry(!secureTextEntry);
  };

  return (
    <View style={styles.inputContainer}>
      <View style={styles.inputWrapper}>
        <View style={styles.inputRow}>
          <Ionicons
            name={icon}
            size={20}
            color="#666"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.inputWithIcon}
            placeholderTextColor="#999999"
            secureTextEntry={secureTextEntry}
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
                color="#666"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const LoginForm = ({ onSubmit }) => {
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
      />
      <InputField
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        isPassword={true}
        icon="lock-closed-outline"
      />
      <TouchableOpacity
        style={styles.button}
        onPress={() => onSubmit(email, password)}
        activeOpacity={0.9}
      >
        <View style={styles.buttonGradient}>
          <Text style={styles.buttonText}>Sign In</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={handleForgotPassword}
        style={styles.forgotPasswordContainer}
        activeOpacity={0.7}
      >
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>
    </View>
  );
};

const RegisterForm = ({ onSubmit }) => {
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
      />
      <InputField
        label="Email"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        icon="mail-outline"
      />
      <InputField
        label="Password"
        placeholder="Create a password"
        value={password}
        onChangeText={setPassword}
        isPassword={true}
        icon="lock-closed-outline"
      />
      <InputField
        label="Confirm Password"
        placeholder="Confirm your password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        isPassword={true}
        icon="lock-closed-outline"
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handleSubmit}
        activeOpacity={0.9}
      >
        <View style={styles.buttonGradient}>
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
  gradient: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  logoTagline: {
    fontSize: 14,
    color: "#666666",
    marginTop: 4,
  },
  tabContainerWrapper: {
    alignItems: "center",
    marginBottom: 10,
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "#eaeaea",
    borderRadius: 12,
    padding: 4,
    width: "100%",
    position: "relative",
    height: 52,
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
  activeTabText: {
    color: "#1a1a1a",
  },
  formContainer: {
    marginTop: 0,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 8,
  },
  inputWrapper: {
    borderRadius: 12,
    overflow: "hidden",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    height: 52,
  },
  inputIcon: {
    paddingLeft: 16,
  },
  inputWithIcon: {
    flex: 1,
    height: 52,
    paddingHorizontal: 12,
    fontSize: 15,
    color: "#333333",
  },
  eyeIcon: {
    padding: 10,
  },
  button: {
    height: 52,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 20,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#333333",
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
    color: "#1a1a1a",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default AuthScreen;
