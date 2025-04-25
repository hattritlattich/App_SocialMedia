import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../db/firebaseConfig";

const ChatListScreen = ({ userId }) => {
  const [chats, setChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredChats, setFilteredChats] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    if (!userId) return;

    const chatsQuery = query(
      collection(db, "chats"),
      where("participants", "array-contains", userId),
      orderBy("lastMessageTimestamp", "desc")
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const chatData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setChats(chatData);
      setFilteredChats(chatData); // Hiển thị toàn bộ ban đầu
    });

    return () => unsubscribe();
  }, [userId]);

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === "") {
      setFilteredChats(chats);
    } else {
      const filtered = chats.filter((chat) =>
        chat.otherUserUsername?.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredChats(filtered);
    }
  };

  const handleChatPress = (chat) => {
    const otherUserId = chat.participants.find((id) => id !== userId);
    navigation.navigate("ChatRoomScreen", { chatId: chat.id, otherUserId });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.chatItem} onPress={() => handleChatPress(item)}>
      <Image
        source={{ uri: item.otherUserProfilePicture || "https://via.placeholder.com/50" }}
        style={styles.avatar}
      />
      <View style={styles.info}>
        <Text style={styles.name}>{item.otherUserName || "Người dùng"}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessage || "Không có tin nhắn"}
        </Text>
      </View>
      <Text style={styles.time}>
        {item.lastMessageTimestamp
          ? new Date(item.lastMessageTimestamp.seconds * 1000).toLocaleTimeString()
          : ""}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <TextInput
        style={styles.searchInput}
        placeholder="Tìm kiếm theo username..."
        value={searchQuery}
        onChangeText={handleSearch}
      />

      {/* Chat List */}
      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          searchQuery ? (
            <Text style={styles.emptyText}>Không tìm thấy kết quả phù hợp.</Text>
          ) : (
            <Text style={styles.emptyText}>Bạn chưa có cuộc trò chuyện nào.</Text>
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  searchInput: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontWeight: "bold",
    fontSize: 16,
  },
  lastMessage: {
    fontSize: 14,
    color: "#666",
  },
  time: {
    fontSize: 12,
    color: "#aaa",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#aaa",
    fontSize: 16,
  },
});

export default ChatListScreen;
