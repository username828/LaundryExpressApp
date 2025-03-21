import React, { useState, useEffect } from "react";
import { uploadImageToCloudinary } from "../../imageService";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
} from "react-native";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../firebaseConfig";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../theme/ThemeContext";
import Header from "../../components/Header";
import Button from "../../components/Button";
import Card from "../../components/Card";

const EditProfileScreen = ({ navigation }) => {
  const theme = useTheme();
  const auth = getAuth();
  const user = auth.currentUser;
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: "",
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [documentId, setDocumentId] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchProfileData = async () => {
      try {
        const profileQuery = query(
          collection(db, "customers"),
          where("email", "==", user.email)
        );

        const querySnapshot = await getDocs(profileQuery);

        if (!querySnapshot.empty) {
          const docSnapshot = querySnapshot.docs[0];
          setDocumentId(docSnapshot.id);
          setProfile(docSnapshot.data());
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  const handleChooseImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Denied",
        "Allow access to your gallery to upload an image."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setUpdating(true); // Show loader while uploading

      try {
        // Upload to Cloudinary
        const uploadedUrl = await uploadImageToCloudinary(result.assets[0].uri);

        // Update state with Cloudinary URL
        setProfile({ ...profile, avatar: uploadedUrl });

        Alert.alert("Success", "Image uploaded successfully!");
      } catch (error) {
        console.error("Image upload error:", error);
        Alert.alert("Error", "Failed to upload image.");
      } finally {
        setUpdating(false);
      }
    }
  };

  const handleUpdateProfile = async () => {
    if (!documentId) return;

    setUpdating(true);
    try {
      await updateDoc(doc(db, "customers", documentId), {
        name: profile.name,
        phone: profile.phone,
        avatar: profile.avatar, // Ensure Cloudinary URL is stored
      });

      Alert.alert("Success", "Profile updated successfully!");
      navigation.goBack();
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Header
          title="Edit Profile"
          leftIcon="arrow-back"
          onLeftPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textLight }]}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Header
        title="Edit Profile"
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.profileCard}>
          <TouchableOpacity
            onPress={handleChooseImage}
            style={styles.avatarContainer}
          >
            <Image
              source={{
                uri:
                  profile.avatar ||
                  "https://static.vecteezy.com/system/resources/thumbnails/020/765/399/small_2x/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg",
              }}
              style={styles.avatar}
            />
            <View
              style={[
                styles.editIconContainer,
                { backgroundColor: theme.colors.primaryLight },
              ]}
            >
              <Ionicons name="camera-outline" size={22} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <Text style={[styles.profileName, { color: theme.colors.text }]}>
            {profile.name || "Your Name"}
          </Text>
          <Text
            style={[styles.profileEmail, { color: theme.colors.textLight }]}
          >
            {profile.email || "email@example.com"}
          </Text>
        </Card>

        <Card style={styles.infoCard}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Personal Information
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.textLight }]}>
              Full Name
            </Text>
            <View
              style={[
                styles.inputContainer,
                { borderColor: theme.colors.border },
              ]}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={theme.colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.inputWithIcon,
                  {
                    color: theme.colors.text,
                  },
                ]}
                placeholder="Enter your full name"
                placeholderTextColor={theme.colors.primary + "99"}
                value={profile.name}
                onChangeText={(text) => setProfile({ ...profile, name: text })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.textLight }]}>
              Email
            </Text>
            <View
              style={[
                styles.inputContainer,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.border + "40", // Increasing opacity for more visible gray background
                },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={theme.colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.inputWithIcon,
                  {
                    color: theme.colors.text,
                    fontStyle: "italic",
                  },
                ]}
                placeholder="Your email address"
                placeholderTextColor={theme.colors.primary + "99"}
                value={profile.email}
                editable={false}
              />
              <View
                style={[
                  styles.readOnlyBadge,
                  { backgroundColor: theme.colors.primary + "30" },
                ]}
              >
                <Text
                  style={[styles.readOnlyText, { color: theme.colors.primary }]}
                >
                  Read-only
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.inputGroup, { marginTop: 10 }]}>
            <Text style={[styles.label, { color: theme.colors.textLight }]}>
              Phone Number
            </Text>
            <View
              style={[
                styles.inputContainer,
                { borderColor: theme.colors.border },
              ]}
            >
              <Ionicons
                name="call-outline"
                size={20}
                color={theme.colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.inputWithIcon,
                  {
                    color: theme.colors.text,
                  },
                ]}
                placeholder="Enter your phone number"
                placeholderTextColor={theme.colors.primary + "99"}
                value={profile.phone}
                onChangeText={(text) => setProfile({ ...profile, phone: text })}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            title="Save Changes"
            icon="save-outline"
            onPress={handleUpdateProfile}
            disabled={updating}
            loading={updating}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  profileCard: {
    marginBottom: 16,
    borderRadius: 16,
    alignItems: "center",
    padding: 24,
    paddingBottom: 20,
  },
  infoCard: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2D9CDB",
    padding: 8,
    borderRadius: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    height: 50, // Fixed height for consistency
  },
  input: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 16,
  },
  inputWithIcon: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
    fontSize: 16,
  },
  inputIcon: {
    paddingHorizontal: 12,
  },
  lockIcon: {
    paddingRight: 12,
  },
  readOnlyBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  readOnlyText: {
    fontSize: 10,
    fontWeight: "600",
  },
  buttonContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
});

export default EditProfileScreen;
