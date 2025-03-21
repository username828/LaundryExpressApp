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
  StatusBar,
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
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../theme/ThemeContext";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Image as ImageIcon,
} from "lucide-react-native";
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
  const theme = useTheme();

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
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDark]}
          style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}
        >
          <View style={styles.headerContent}>
            <Text style={styles.title}>Customer Complaints</Text>
            <Text style={styles.subtitle}>
              Manage and resolve customer issues
            </Text>
          </View>
        </LinearGradient>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading complaints...</Text>
          </View>
        ) : complaints.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconContainer,
                { backgroundColor: theme.colors.primary + "15" },
              ]}
            >
              <AlertCircle color={theme.colors.primary} size={48} />
            </View>
            <Text style={styles.emptyText}>No complaints found</Text>
            <Text style={styles.emptySubText}>
              You don't have any customer complaints at the moment
            </Text>
          </View>
        ) : (
          <FlatList
            data={complaints}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.complaintCard,
                  {
                    borderLeftColor:
                      item.status === "Pending"
                        ? theme.colors.warning
                        : theme.colors.success,
                  },
                ]}
              >
                {/* Complaint Image (if available) */}
                {item.imageUrl && (
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.complaintImage}
                      resizeMode="cover"
                    />
                    <View style={styles.imageOverlayContainer}>
                      <ImageIcon size={16} color="#FFFFFF" />
                      <Text style={styles.imageOverlayText}>
                        Complaint Evidence
                      </Text>
                    </View>
                  </View>
                )}

                {/* Status Badge */}
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        item.status === "Pending"
                          ? theme.colors.warning + "15"
                          : theme.colors.success + "15",
                    },
                  ]}
                >
                  {item.status === "Pending" ? (
                    <Clock
                      size={14}
                      color={theme.colors.warning}
                      style={styles.statusIcon}
                    />
                  ) : (
                    <CheckCircle
                      size={14}
                      color={theme.colors.success}
                      style={styles.statusIcon}
                    />
                  )}
                  <Text
                    style={[
                      styles.status,
                      item.status === "Pending"
                        ? { color: theme.colors.warning }
                        : { color: theme.colors.success },
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>

                {/* Order ID */}
                <View style={styles.row}>
                  <FileText size={18} color={theme.colors.primary} />
                  <Text style={styles.text}> Order ID: {item.orderId}</Text>
                </View>

                {/* Customer Issue */}
                <View style={styles.issueContainer}>
                  <View style={styles.issueHeader}>
                    <AlertCircle size={18} color={theme.colors.error} />
                    <Text style={styles.issueTitle}> Issue Description</Text>
                  </View>
                  <Text style={styles.issue}>{item.description}</Text>
                </View>

                {/* Resolve Button */}
                {item.status === "Pending" && (
                  <TouchableOpacity
                    style={[
                      styles.resolveButton,
                      { backgroundColor: theme.colors.primary },
                    ]}
                    onPress={() => resolveComplaint(item.id)}
                    disabled={updating === item.id}
                  >
                    {updating === item.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <CheckCircle
                          size={18}
                          color="#fff"
                          style={styles.buttonIcon}
                        />
                        <Text style={styles.buttonText}>Mark as Resolved</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {/* Resolved Info */}
                {item.status === "Resolved" && (
                  <View style={styles.resolvedInfo}>
                    <Text style={styles.resolvedText}>
                      This complaint has been resolved
                    </Text>
                  </View>
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
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerContent: {
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666666",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    paddingTop: 60,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    color: "#333333",
    fontWeight: "600",
  },
  emptySubText: {
    marginTop: 8,
    fontSize: 14,
    color: "#999999",
    textAlign: "center",
    maxWidth: "80%",
  },
  complaintCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  imageContainer: {
    position: "relative",
    marginBottom: 16,
    borderRadius: 10,
    overflow: "hidden",
  },
  complaintImage: {
    width: "100%",
    height: 180,
    borderRadius: 10,
  },
  imageOverlayContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  imageOverlayText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 6,
  },
  statusBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  statusIcon: {
    marginRight: 4,
  },
  status: {
    fontSize: 13,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  issueContainer: {
    backgroundColor: "#F9F9FB",
    padding: 16,
    borderRadius: 12,
    marginVertical: 12,
  },
  issueHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  issueTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333333",
  },
  issue: {
    fontSize: 14,
    color: "#555555",
    lineHeight: 20,
  },
  resolveButton: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  resolvedInfo: {
    backgroundColor: "#F9F9FB",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  resolvedText: {
    fontSize: 14,
    color: "#666666",
    fontStyle: "italic",
  },
});

export default ServiceProviderComplaints;
