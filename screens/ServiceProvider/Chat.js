import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../theme/ThemeContext";
import Header from "../../components/Header";
import { getAuth } from "firebase/auth";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";

const Chat = ({ route }) => {
  const {
    orderId,
    serviceProviderId,
    serviceProviderName,
    customerId,
    customerName,
  } = route.params;

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef(null);
  const navigation = useNavigation();
  const theme = useTheme();
  const auth = getAuth();
  const currentUserId = auth.currentUser?.uid;
  const isServiceProvider = currentUserId === serviceProviderId;

  // Determine the current user's name and role
  const currentUserName = isServiceProvider
    ? serviceProviderName
    : customerName;
  const currentUserRole = isServiceProvider ? "provider" : "customer";

  // Determine the other party's ID and name
  const otherUserId = isServiceProvider ? customerId : serviceProviderId;
  const otherUserName = isServiceProvider ? customerName : serviceProviderName;

  useEffect(() => {
    // Create a query for messages related to this specific order - only filter by orderId
    const messagesQuery = query(
      collection(db, "chats"),
      where("orderId", "==", orderId)
    );

    // Listen for real-time updates
    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messagesList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt
            ? doc.data().createdAt.toDate()
            : new Date(),
        }));

        // Sort messages by createdAt on the frontend
        messagesList.sort((a, b) => a.createdAt - b.createdAt);

        setMessages(messagesList);
        setLoading(false);

        // Scroll to bottom when new messages arrive
        if (messagesList.length > 0 && flatListRef.current) {
          setTimeout(() => {
            flatListRef.current.scrollToEnd({ animated: true });
          }, 200);
        }
      },
      (error) => {
        console.error("Error fetching messages:", error);
        setLoading(false);
      }
    );

    // Cleanup subscription
    return () => unsubscribe();
  }, [orderId]);

  const sendMessage = async () => {
    if (inputMessage.trim() === "") return;

    try {
      await addDoc(collection(db, "chats"), {
        orderId,
        text: inputMessage.trim(),
        senderId: currentUserId,
        senderName: currentUserName,
        senderRole: currentUserRole,
        receiverId: otherUserId,
        receiverName: otherUserName,
        createdAt: serverTimestamp(),
      });

      setInputMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderMessageItem = ({ item }) => {
    const isCurrentUser = item.senderId === currentUserId;

    return (
      <View
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.sentMessage : styles.receivedMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isCurrentUser ? theme.colors.primary : "#EAEAEA",
              borderBottomRightRadius: isCurrentUser ? 0 : 12,
              borderBottomLeftRadius: isCurrentUser ? 12 : 0,
            },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isCurrentUser ? "#FFFFFF" : "#333333" },
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
              styles.messageTime,
              { color: isCurrentUser ? "rgba(255,255,255,0.7)" : "#888888" },
            ]}
          >
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Header
        title={`Chat with ${otherUserName}`}
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : null}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.orderInfoContainer}>
          <Text style={styles.orderInfoText}>
            Order #{orderId.substring(0, 8)}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.messagesList}
            onLayout={() => {
              if (messages.length > 0 && flatListRef.current) {
                flatListRef.current.scrollToEnd({ animated: false });
              }
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={50}
                  color="#CCCCCC"
                />
                <Text style={styles.emptyText}>No messages yet</Text>
                <Text style={styles.emptySubText}>Start the conversation!</Text>
              </View>
            }
          />
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { backgroundColor: "#F0F0F0" }]}
            placeholder="Type a message..."
            value={inputMessage}
            onChangeText={setInputMessage}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={sendMessage}
            disabled={inputMessage.trim() === ""}
          >
            <Ionicons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  orderInfoContainer: {
    padding: 10,
    backgroundColor: "#F5F5F5",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    alignItems: "center",
  },
  orderInfoText: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666666",
    fontSize: 16,
  },
  messagesList: {
    flexGrow: 1,
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: "80%",
  },
  sentMessage: {
    alignSelf: "flex-end",
  },
  receivedMessage: {
    alignSelf: "flex-start",
  },
  messageBubble: {
    padding: 12,
    borderRadius: 12,
    minWidth: 80,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 11,
    alignSelf: "flex-end",
  },
  inputContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    backgroundColor: "#FFFFFF",
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: "#888888",
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: "#AAAAAA",
    marginTop: 8,
  },
});

export default Chat;
