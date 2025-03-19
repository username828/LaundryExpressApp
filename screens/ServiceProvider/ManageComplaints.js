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
    paddingHorizontal: 15,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#007bff",
  },
  noComplaints: {
    textAlign: "center",
    fontSize: 16,
    color: "#6c757d",
    marginTop: 20,
  },
  complaintCard: {
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderLeftWidth: 5,
    borderLeftColor: "#dc3545",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  complaintImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  issue: {
    fontSize: 15,
    color: "#dc3545",
  },
  status: {
    fontSize: 15,
    fontWeight: "bold",
  },
  pending: {
    color: "#f39c12", // Orange for Pending
  },
  resolved: {
    color: "#28a745", // Green for Resolved
  },
  resolveButton: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#28a745", // Green for Resolved
    paddingVertical: 10,
    borderRadius: 5,
    justifyContent: "center",
  },
  buttonIcon: {
    marginRight: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ServiceProviderComplaints;
