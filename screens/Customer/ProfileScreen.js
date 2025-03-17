import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigation } from "@react-navigation/core";
import { db } from "../../firebaseConfig";
import { useFocusEffect } from "@react-navigation/native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

const ProfileScreen = () => {
  const auth = getAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [favoriteProviders, setFavoriteProviders] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;

      try {
        const profileQuery = query(
          collection(db, "customers"),
          where("email", "==", user.email)
        );

        const querySnapshot = await getDocs(profileQuery);

        if (!querySnapshot.empty) {
          setProfile(querySnapshot.docs[0].data());
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const loadFavorites = async () => {
        try {
          const storedFavorites = await AsyncStorage.getItem("favorites");
          if (storedFavorites && isActive) {
            setFavorites(JSON.parse(storedFavorites));
          }
        } catch (error) {
          console.error("Error loading favorites:", error);
        }
      };

      loadFavorites();

      return () => {
        isActive = false;
      };
    }, [])
  );

  useEffect(() => {
    const fetchFavoriteProviders = async () => {
      if (favorites.length === 0) return;

      try {
        const providersQuery = query(
          collection(db, "serviceProviders"),
          where("serviceProviderId", "in", favorites)
        );

        const querySnapshot = await getDocs(providersQuery);
        const providers = querySnapshot.docs.map((doc) => doc.data());
        setFavoriteProviders(providers);
      } catch (error) {
        console.error("Error fetching favorite providers:", error);
      }
    };

    fetchFavoriteProviders();
  }, [favorites]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace("Auth");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["top"]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["top"]}>
        <MaterialIcons name="error-outline" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>No profile found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={[styles.header, { marginTop: insets.top > 0 ? 0 : 20 }]}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <FlatList
        ListHeaderComponent={
          <>
            <View style={styles.profileContainer}>
              <View style={styles.avatarContainer}>
                <Image
                  source={{
                    uri: profile.avatar || "https://via.placeholder.com/100",
                  }}
                  style={styles.profileImage}
                />
              </View>
              <Text style={styles.name}>{profile.name}</Text>
              <Text style={styles.email}>{profile.email}</Text>

              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate("EditProfile")}
                >
                  <MaterialIcons name="edit" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Edit Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.ordersButton]}
                  onPress={() => navigation.navigate("Orders")}
                >
                  <MaterialIcons name="receipt" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>View Orders</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <MaterialIcons name="favorite" size={20} color="#FF3B30" />
              <Text style={styles.sectionTitle}>My Favorites</Text>
            </View>

            {favoriteProviders.length === 0 && (
              <View style={styles.emptyStateContainer}>
                <MaterialIcons
                  name="favorite-border"
                  size={48}
                  color="#CCCCCC"
                />
                <Text style={styles.noFavoritesText}>
                  No favorites added yet.
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Your favorite laundry services will appear here
                </Text>
              </View>
            )}
          </>
        }
        data={favoriteProviders}
        keyExtractor={(item) => item.serviceProviderId}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate("ServiceProviderScreen", {
                providerId: item.serviceProviderId,
              })
            }
          >
            <Image source={{ uri: item.image }} style={styles.cardImage} />
            <View style={styles.cardContent}>
              <Text style={styles.providerName}>{item.name}</Text>
              <View style={styles.ratingContainer}>
                <MaterialIcons name="star" size={16} color="#FFC107" />
                <Text style={styles.rating}>{item.rating}</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#CCCCCC" />
          </TouchableOpacity>
        )}
        ListFooterComponent={
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={20} color="#FFFFFF" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        }
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666666",
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
  },
  profileContainer: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    padding: 3,
    borderRadius: 60,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: "#007AFF",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 20,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 6,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  ordersButton: {
    backgroundColor: "#34C759",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
    marginLeft: 6,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
    color: "#333333",
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    backgroundColor: "#FFFFFF",
    margin: 20,
    borderRadius: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  noFavoritesText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#666666",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999999",
    textAlign: "center",
    marginTop: 8,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
    marginHorizontal: 16,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  cardImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
    justifyContent: "center",
  },
  providerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    fontSize: 14,
    color: "#666666",
    marginLeft: 4,
  },
  logoutButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 14,
    marginHorizontal: 40,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
});

export default ProfileScreen;
