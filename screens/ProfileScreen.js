import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
} from "react-native";
import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigation } from "@react-navigation/core";
import { db } from "../firebaseConfig";
import { useFocusEffect } from "@react-navigation/native";

const ProfileScreen = () => {
  const auth = getAuth();
  const navigation = useNavigation();

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
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No profile found.</Text>
      </View>
    );
  }

  return (
    <FlatList
      ListHeaderComponent={
        <>
          <View style={styles.profileContainer}>
            <Image
              source={{
                uri: profile.avatar || "https://via.placeholder.com/100",
              }}
              style={styles.profileImage}
            />
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.email}>{profile.email}</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate("EditProfile")}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>

            {/* Orders Button */}
            <TouchableOpacity
              style={styles.ordersButton}
              onPress={() => navigation.navigate("Orders")}
            >
              <Text style={styles.ordersButtonText}>View Orders</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>My Favourites</Text>
          {favoriteProviders.length === 0 && (
            <Text style={styles.noFavoritesText}>No favorites added yet.</Text>
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
            <Text style={styles.rating}>⭐ {item.rating}</Text>
          </View>
        </TouchableOpacity>
      )}
      ListFooterComponent={
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      }
      contentContainerStyle={{ paddingBottom: 20 }}
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
  },

  profileContainer: {
    alignItems: "center",
    marginTop: 40,
    paddingHorizontal: 20,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: "#007AFF",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: "#555",
  },

  editButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 12,
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 12,
    paddingHorizontal: 20,
    textAlign: "center",
    color: "#333",
  },
  noFavoritesText: {
    textAlign: "center",
    color: "#777",
    fontSize: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
    marginHorizontal: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  cardImage: {
    width: 85,
    height: 85,
    borderRadius: 10,
    marginRight: 14,
  },
  cardContent: {
    justifyContent: "center",
    flex: 1,
  },
  providerName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  rating: {
    fontSize: 15,
    color: "#777",
  },

  logoutButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 12,
    marginHorizontal: 40,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 25,
    elevation: 4,
    shadowColor: "#FF3B30",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  logoutButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  ordersButton: { 
    backgroundColor: '#34C759', 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    borderRadius: 10, 
    marginTop: 12, 
    alignItems: 'center' 
  },
  ordersButtonText: { 
    color: '#fff', 
    fontWeight: '600', 
    fontSize: 16 
  },
  
});

export default ProfileScreen;
