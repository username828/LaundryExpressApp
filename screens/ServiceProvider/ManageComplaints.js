import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig"; // Firestore instance
import { getAuth } from "firebase/auth";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {
  SafeAreaView,
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const auth = getAuth();

const ServiceProviderComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const insets = useSafeAreaInsets(); // Safe area insets

  const user = auth.currentUser;
  const userId = user?.uid;

  useEffect(() => {
    if (!userId) return;

    const fetchComplaints = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "complaints"),
          where("providerId", "==", userId)
        );
        const querySnapshot = await getDocs(q);
        const complaintsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setComplaints(complaintsData);
      } catch (error) {
        console.error("Error fetching complaints:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, [user]);

  const resolveComplaint = async (complaintId) => {
    setUpdating(complaintId);
    try {
      const complaintRef = doc(db, "complaints", complaintId);
      await updateDoc(complaintRef, { status: "Resolved" });

      setComplaints((prev) =>
        prev.map((comp) =>
          comp.id === complaintId ? { ...comp, status: "Resolved" } : comp
        )
      );

      Alert.alert("Success", "Complaint marked as Resolved.");
    } catch (error) {
      console.error("Error updating complaint:", error);
      Alert.alert("Error", "Could not update complaint.");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.title}>Customer Complaints</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#007bff" />
        ) : complaints.length === 0 ? (
          <Text style={styles.noComplaints}>No complaints found.</Text>
        ) : (
          <FlatList
            data={complaints}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: insets.bottom }} // Ensure content isn't hidden by bottom insets
            renderItem={({ item }) => (
              <View style={styles.complaintCard}>
                {/* Complaint Image (if available) */}
                {item.imageUrl && (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.complaintImage}
                    resizeMode="cover"
                  />
                )}
                {/* Order ID */}
                <View style={styles.row}>
                  <Icon
                    name="file-document-outline"
                    size={20}
                    color="#007bff"
                  />
                  <Text style={styles.text}> Order ID: {item.orderId}</Text>
                </View>

                {/* Customer Issue */}
                <View style={styles.row}>
                  <Icon name="alert-circle-outline" size={20} color="#dc3545" />
                  <Text style={styles.issue}> Issue: {item.description}</Text>
                </View>

                {/* Status */}
                <View style={styles.row}>
                  <Icon
                    name={
                      item.status === "Pending"
                        ? "clock-outline"
                        : "check-circle-outline"
                    }
                    size={20}
                    color={item.status === "Pending" ? "#f39c12" : "#28a745"}
                  />
                  <Text
                    style={[
                      styles.status,
                      item.status === "Pending"
                        ? styles.pending
                        : styles.resolved,
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>

                {/* Resolve Button */}
                {item.status === "Pending" && (
                  <TouchableOpacity
                    style={styles.resolveButton}
                    onPress={() => resolveComplaint(item.id)}
                    disabled={updating === item.id}
                  >
                    {updating === item.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Icon
                          name="check-circle-outline"
                          size={20}
                          color="#fff"
                          style={styles.buttonIcon}
                        />
                        <Text style={styles.buttonText}>Mark as Resolved</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    marginVertical: 20,
    textAlign: "center",
    color: "#333333",
  },
  noComplaints: {
    textAlign: "center",
    fontSize: 16,
    color: "#666666",
    marginTop: 24,
  },
  complaintCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#333333",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  complaintImage: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  issue: {
    fontSize: 15,
    color: "#666666",
    flex: 1,
  },
  status: {
    fontSize: 15,
    fontWeight: "600",
  },
  pending: {
    color: "#ff9800", // Orange for Pending
  },
  resolved: {
    color: "#4caf50", // Green for Resolved
  },
  resolveButton: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333333",
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
  },
  buttonIcon: {
    marginRight: 5,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default ServiceProviderComplaints;
