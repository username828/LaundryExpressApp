import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
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
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const EditProfileScreen = ({ navigation }) => {
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
      setProfile({ ...profile, avatar: result.assets[0].uri });
    }
  };

  const handleUpdateProfile = async () => {
    if (!documentId) return;

    setUpdating(true);
    try {
      await updateDoc(doc(db, "customers", documentId), profile);
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Edit Profile</Text>

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
        <MaterialIcons
          name="edit"
          size={24}
          color="#007AFF"
          style={styles.editIcon}
        />
      </TouchableOpacity>

      <View style={{ width: "100%" }}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={profile.name}
          onChangeText={(text) => setProfile({ ...profile, name: text })}
        />
      </View>

      <View style={{ width: "100%" }}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={profile.email}
          editable={false} // Email should not be editable
        />
      </View>

      <View style={{ width: "100%" }}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={profile.phone}
          onChangeText={(text) => setProfile({ ...profile, phone: text })}
          keyboardType="phone-pad"
        />
      </View>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleUpdateProfile}
        disabled={updating}
      >
        {updating ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.saveButtonText}>Save Changes</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default EditProfileScreen;

const styles = {
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FFF",
    alignItems: "center",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  avatarContainer: {
    position: "relative",
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  editIcon: {
    position: "absolute",
    bottom: 0,
    right: 5,
    backgroundColor: "#FFF",
    padding: 5,
    borderRadius: 20,
    elevation: 3,
  },
  input: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 8,
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
};
