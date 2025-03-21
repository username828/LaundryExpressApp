import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
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
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import Header from "../../components/Header";
import Card from "../../components/Card";
import Button from "../../components/Button";

const ProfileScreen = () => {
  const auth = getAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

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
      const fetchFavoriteProviders = async () => {
        try {
          const storedFavorites = await AsyncStorage.getItem("favorites");

          const favoriteIds = storedFavorites
            ? JSON.parse(storedFavorites)
            : [];

          if (favoriteIds.length === 0) {
            setFavoriteProviders([]); // No favorites exist
            return;
          }

          // Retrieve stored service providers
          const storedProviders = await AsyncStorage.getItem(
            "serviceProviders"
          );

          const allProviders = storedProviders
            ? JSON.parse(storedProviders)
            : [];

          const favoriteProviders = allProviders.filter((provider) =>
            favoriteIds.includes(provider.serviceProviderId)
          );

          setFavoriteProviders(favoriteProviders);
        } catch (error) {
          console.error("Error fetching favorite providers:", error);
        }
      };

      fetchFavoriteProviders();
    }, [])
  );

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
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Header title="My Profile" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textLight }]}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Header title="My Profile" />
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={60}
            color={theme.colors.error}
          />
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            No profile found
          </Text>
          <Text
            style={[styles.errorSubText, { color: theme.colors.textLight }]}
          >
            We couldn't find your profile information
          </Text>
          <Button
            title="Go to Home"
            icon="home-outline"
            onPress={() => navigation.navigate("Home")}
            style={{ marginTop: 20 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Header title="My Profile" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri:
                  profile.avatar ||
                  "https://static.vecteezy.com/system/resources/thumbnails/020/765/399/small_2x/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg",
              }}
              style={styles.profileImage}
            />
          </View>
          <Text style={[styles.name, { color: theme.colors.text }]}>
            {profile.name}
          </Text>
          <Text style={[styles.email, { color: theme.colors.textLight }]}>
            {profile.email}
          </Text>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => navigation.navigate("EditProfile")}
            >
              <Ionicons name="create-outline" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.success },
              ]}
              onPress={() => navigation.navigate("Orders")}
            >
              <Ionicons name="receipt-outline" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>View Orders</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <View style={styles.sectionHeader}>
          <Ionicons name="heart" size={20} color={theme.colors.error} />
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            My Favorites
          </Text>
        </View>

        {favoriteProviders.length === 0 ? (
          <Card style={styles.emptyStateCard}>
            <View style={styles.emptyStateContainer}>
              <Ionicons
                name="heart-outline"
                size={60}
                color={theme.colors.border}
              />
              <Text
                style={[styles.noFavoritesText, { color: theme.colors.text }]}
              >
                No favorites added yet
              </Text>
              <Text
                style={[
                  styles.emptyStateSubtext,
                  { color: theme.colors.textLight },
                ]}
              >
                Your favorite laundry services will appear here
              </Text>
              <Button
                title="Explore Services"
                icon="search-outline"
                onPress={() => navigation.navigate("Home")}
                variant="outlined"
                style={{ marginTop: 16 }}
              />
            </View>
          </Card>
        ) : (
          favoriteProviders.map((item) => (
            <Card key={item.serviceProviderId} style={styles.favoriteCard}>
              <TouchableOpacity
                style={styles.favoriteCardContent}
                onPress={() =>
                  navigation.navigate("ServiceProviderScreen", {
                    providerId: item.serviceProviderId,
                  })
                }
              >
                <Image source={{ uri: item.image }} style={styles.cardImage} />
                <View style={styles.cardContent}>
                  <Text
                    style={[styles.providerName, { color: theme.colors.text }]}
                  >
                    {item.name}
                  </Text>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text
                      style={[styles.rating, { color: theme.colors.textLight }]}
                    >
                      {item.rating}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            </Card>
          ))
        )}

        <Button
          title="Logout"
          icon="log-out-outline"
          onPress={handleLogout}
          variant="error"
          style={styles.logoutButton}
        />
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
    paddingBottom: 40,
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubText: {
    fontSize: 14,
    textAlign: "center",
  },
  profileCard: {
    alignItems: "center",
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
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
    borderColor: "#FFFFFF",
  },
  name: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    marginBottom: 20,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    marginTop: 10,
    gap: 12,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
    marginLeft: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  emptyStateCard: {
    borderRadius: 16,
    marginBottom: 20,
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  noFavoritesText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 250,
  },
  favoriteCard: {
    borderRadius: 16,
    marginBottom: 12,
    padding: 0,
    overflow: "hidden",
  },
  favoriteCardContent: {
    flexDirection: "row",
    padding: 14,
    alignItems: "center",
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
    fontWeight: "600",
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    fontSize: 14,
    marginLeft: 4,
  },
  logoutButton: {
    marginTop: 24,
    marginHorizontal: 8,
  },
});

export default ProfileScreen;
