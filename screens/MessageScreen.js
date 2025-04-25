import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  getDatabase,
  ref,
  onValue,
  push,
  set,
  serverTimestamp,
  query,
  orderByChild,
} from "firebase/database";

const MessageScreen = ({ route }) => {
  const { recipientId, recipientName, recipientProfilePicture, senderId } = route.params;

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const database = getDatabase();

  useEffect(() => {
    const messageRef = ref(database, "firebasedata/messages");
    const messageQuery = query(messageRef, orderByChild("createdAt"));

    const unsubscribe = onValue(messageQuery, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const filteredMessages = Object.entries(data)
        .map(([key, message]) => ({ ...message, key }))
        .filter(
          (message) =>
            (message.senderId === senderId && message.receiverId === recipientId) ||
            (message.receiverId === senderId && message.senderId === recipientId)
        )
        .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));

      setMessages(filteredMessages);

      // 🔥 Hiển thị thông báo nếu tin nhắn mới từ người nhận
      const latestMessage = filteredMessages[filteredMessages.length - 1];
      if (latestMessage && latestMessage.senderId === recipientId) {
        Alert.alert("Tin nhắn mới", latestMessage.content);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [senderId, recipientId]);

  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      const newMessageData = {
        senderId,
        receiverId: recipientId,
        content: newMessage.trim(),
        createdAt: serverTimestamp(),
      };

      try {
        const newMessageRef = push(ref(database, "firebasedata/messages"));
        await set(newMessageRef, newMessageData);
        setNewMessage("");
      } catch (error) {
        console.error("Lỗi gửi tin nhắn: ", error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={
            recipientProfilePicture
              ? { uri: recipientProfilePicture }
              : require("../assets/avatar.jpg")
          }
          style={styles.avatar}
        />
        <Text style={styles.username}>{recipientName}</Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <View style={[styles.message, item.senderId === senderId ? styles.myMessage : styles.otherMessage]}>
            <Text style={styles.messageText}>{item.content}</Text>
          </View>
        )}
        contentContainerStyle={styles.messagesContainer}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nhập tin nhắn..."
          value={newMessage}
          onChangeText={setNewMessage}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <Ionicons name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { flexDirection: "row", alignItems: "center", padding: 10, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#ddd" },
  avatar: { width: 45, height: 45, borderRadius: 25, marginRight: 10 },
  username: { fontSize: 16, fontWeight: "bold" },
  messagesContainer: { paddingHorizontal: 10, paddingBottom: 10 },
  message: { maxWidth: "75%", marginVertical: 5, padding: 12, borderRadius: 20 },
  myMessage: { alignSelf: "flex-end", backgroundColor: "#8A2BE2" },
  otherMessage: { alignSelf: "flex-start", backgroundColor: "#E4E6EB" },
  messageText: { fontSize: 16, color: "#000000" },
  inputContainer: { flexDirection: "row", alignItems: "center", padding: 10, backgroundColor: "#FFFFFF", borderTopWidth: 1, borderTopColor: "#ddd" },
  input: { flex: 1, height: 42, borderRadius: 25, paddingHorizontal: 15, backgroundColor: "#F0F0F0", fontSize: 16 },
  sendButton: { marginLeft: 10, backgroundColor: "#8A2BE2", padding: 10, borderRadius: 25 },
});

export default MessageScreen;
