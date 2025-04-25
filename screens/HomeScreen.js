import React, { useState, useEffect, useRef } from "react";
import { useNavigation } from '@react-navigation/native';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  Image,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from "react-native";
import { db } from "../db/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  getDoc,
  doc,
  deleteDoc,
  setDoc,
  updateDoc,
  increment,
  writeBatch,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";


const windowWidth = Dimensions.get("window").width;

const HomeScreen = () => {
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [following, setFollowing] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false); // Cờ kiểm tra trạng thái xử lý
  const [userStory, setUserStory] = useState(null);

  const auth = getAuth();
  const user = auth.currentUser;
  const userId = user ? user.uid : null;
  const navigation = useNavigation();
  
  const [isCommentBottomSheetVisible, setIsCommentBottomSheetVisible] = useState(false);
  const commentBottomSheetRef = useRef(null);
  const fetchStories = async () => {
    if (!userId) return;

    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      const userData = userSnap.exists() ? userSnap.data() : {};

      const currentUserStory = {
        id: userId,
        username: userData.username || "Your Story",
        profilePicture: userData.profilePicture || null,
        isCurrentUser: true,
      };

      const followingQuery = query(
        collection(db, "followers"),
        where("followerId", "==", userId)
      );

      const snapshot = await getDocs(followingQuery);
      const followingStories = snapshot.docs.map((doc) => ({
        id: doc.data().followedId,
        username: doc.data().username || "Anonymous",
        profilePicture: doc.data().profilePicture || null,
      }));

      setUserStory([currentUserStory, ...followingStories]);
    } catch (error) {
      console.error("Error fetching stories:", error);
    }
  };

  const fetchFollowing = async () => {
    if (!userId) return;

    try {
      const followingQuery = query(
        collection(db, "followers"),
        where("followerId", "==", userId)
      );

      const snapshot = await getDocs(followingQuery);
      const followingList = snapshot.docs.map((doc) => doc.data().followedId);
      setFollowing(followingList);
    } catch (error) {
      console.error("Error fetching following list:", error);
    }
  };

  const fetchPosts = async () => {
    if (!userId) return;

    try {
      const userIds = [userId, ...following];
      const postsQuery = query(
        collection(db, "posts"),
        where("uid", "in", userIds)
      );

      const snapshot = await getDocs(postsQuery);
      const loadedPosts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const postsWithUserInfo = await Promise.all(
        loadedPosts.map(async (post) => {
          const userRef = doc(db, "users", post.uid);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.exists() ? userSnap.data() : {};
          return {
            ...post,
            username: userData.username || "Anonymous",
            profilePicture: userData.profilePicture || null,
            mediaUrls: post.mediaUrls || [],
          };
        })
      );

      setPosts(postsWithUserInfo);
    } catch (error) {
      console.error("Error fetching posts:", error.message);
    }
  };

  const fetchLikedPosts = async () => {
    if (!userId) return;

    try {
      const likesQuery = query(
        collection(db, "likes"),
        where("uid", "==", userId)
      );

      const snapshot = await getDocs(likesQuery);
      const likedPostIds = snapshot.docs.map((doc) => doc.data().postId);
      setLikedPosts(likedPostIds);
    } catch (error) {
      console.error("Error fetching liked posts:", error.message);
    }
  };

  const toggleLike = async (postId) => {
    if (!userId || isProcessing) return; // Nếu đang xử lý thì không làm gì thêm
    setIsProcessing(true); // Đánh dấu bắt đầu xử lý
  
    const isLiked = likedPosts.includes(postId);
    const postRef = doc(db, "posts", postId);
    const batch = writeBatch(db); // Tạo một batch
  
    // Cập nhật UI ngay lập tức
    setLikedPosts((prev) =>
      isLiked ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
  
    try {
      if (isLiked) {
        // Xóa like trong Firestore
        batch.delete(doc(db, "likes", `${userId}_${postId}`));
        batch.update(postRef, { likesCount: increment(-1) });
      } else {
        // Thêm like vào Firestore
        batch.set(doc(db, "likes", `${userId}_${postId}`), {
          uid: userId,
          postId: postId,
          createdAt: new Date(),
        });
        batch.update(postRef, { likesCount: increment(1) });
      }
  
      await batch.commit(); // Thực hiện tất cả các thao tác trong một lần
    } catch (error) {
      console.error("Error toggling like:", error.message);
      // Hoàn tác cập nhật UI nếu có lỗi
      setLikedPosts((prev) =>
        isLiked ? [...prev, postId] : prev.filter((id) => id !== postId)
      );
    } finally {
      setIsProcessing(false); // Kết thúc xử lý
    }
  };
  
  
  

  useEffect(() => {
    const fetchData = async () => {
      await fetchFollowing();
      await fetchPosts();
      await fetchLikedPosts();
      await fetchStories();
    };

    if (userId) fetchData();
  }, [userId, following]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFollowing();
    await fetchPosts();
    await fetchLikedPosts();
    setRefreshing(false);
  };
  const handleOpenCommentsScreen = (postId) => {
    navigation.navigate("CommentsScreen", { postId });
  };
  
  const renderStory = ({ item }) => {
  const defaultAvatar = require("../assets/avatar.jpg");
  const avatarSource = item.profilePicture
    ? { uri: item.profilePicture }
    : defaultAvatar;
    const handleAddStory = () => {
      if (item.isCurrentUser) {
        navigation.navigate("CameraScreen"); // Điều hướng đến màn hình camera
      }
    };
  return (
    <TouchableOpacity onPress={handleAddStory}>
    <View style={styles.storyContainer}>
      <View style={styles.avatarWrapper}>
        <Image source={avatarSource} style={styles.storyAvatar} />
        {item.isCurrentUser && (
          <View style={styles.addIconContainer}>
            <Text style={styles.addIconText}>+</Text>
          </View>
        )}
      </View>
      <Text style={styles.storyUsername}>{item.username}</Text>
    </View>
  </TouchableOpacity>
  );
};
  const renderPost = ({ item }) => {
    const defaultAvatar = require("../assets/avatar.jpg");
    const avatarSource = item.profilePicture
      ? { uri: item.profilePicture }
      : defaultAvatar;
  
    const isLiked = likedPosts.includes(item.id);
  
    return (
      <View style={styles.postContainer}>
        <View style={styles.header}>
          <Image source={avatarSource} style={styles.avatar} />
          <View>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.timestamp}>
              {item.createdAt
                ? new Date(item.createdAt.seconds * 1000).toLocaleString()
                : "No timestamp"}
            </Text>
          </View>
        </View>
        <Text style={styles.content}>{item.content || ""}</Text>
        <FlatList
          data={item.mediaUrls}
          horizontal
          keyExtractor={(image, index) => index.toString()}
          renderItem={({ item: imageUrl, index }) => (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUrl }} style={styles.postImage} />
              <Text style={styles.imageCounter}>
                {index + 1}/{item.mediaUrls.length}
              </Text>
            </View>
          )}
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          snapToAlignment="center"
        />
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => toggleLike(item.id)}>
            <MaterialCommunityIcons
              name={isLiked ? "heart" : "heart-outline"}
              size={25}
              color={isLiked ? "red" : "#1d3557"}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleOpenCommentsScreen(item.id)}>
            <MaterialCommunityIcons
              name="comment-outline"
              size={25}
              color="#1d3557"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialCommunityIcons name="send-outline" size={25} color="#1d3557" />
          </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('LikeScreen', { postId: item.id })}>
            <Text style={styles.likesCount}>
              {item.likesCount?.toLocaleString() || 0} lượt thích
            </Text>
          </TouchableOpacity>
      </View>
    );
  };
  

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <FlatList
            data={userStory}
            horizontal
            keyExtractor={(item) => item.id}
            renderItem={renderStory}
            showsHorizontalScrollIndicator={false}
            style={styles.storyList}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
  
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f0f0" },
  postContainer: { backgroundColor: "#fff", marginBottom: 10 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  avatar: { width: 50, height: 50, borderRadius: 25, margin: 8 },
  username: { fontWeight: "bold", fontSize: 16 },
  timestamp: { fontSize: 12, color: "#888" },
  content: { fontSize: 14, marginLeft: 8, marginBottom: 8 },
  imageContainer: { width: windowWidth, height: 450 },
  postImage: { width: "100%", height: "100%", resizeMode: "cover" },
  imageCounter: {
    position: "absolute",
    bottom: 8,
    right: 8,
    color: "#fff",
    fontWeight: "bold",
  },
  actions: {
    flexDirection: "row", // Đảm bảo các biểu tượng nằm ngang
    justifyContent: "flex-start", // Căn trái
    alignItems: "center", // Căn giữa theo chiều dọc
    padding: 10, // Khoảng cách xung quanh
    gap: 15, // Khoảng cách giữa các biểu tượng
  },
  actionButton: { flexDirection: "row", alignItems: "center" },
  likesCount: {
    marginLeft: 10,
    marginBottom: 10,
    fontSize: 13,
    color: "#1d3557",
  },
  commentBottomSheetContent: {
    padding: 20,
    backgroundColor: '#fff',
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#eee',
    borderRadius: 5,
  },
  list: { paddingBottom: 10 },
  storyList: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: "#f9f9f9",
  },
  storyContainer: {
    alignItems: "center",
    marginRight: 20,
  },
  avatarWrapper: {
    position: "relative",
    width: 100,
    height: 100,
  },
  storyAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#007BFF",
  },
  addIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#007BFF",
    justifyContent: "center",
    alignItems: "center",
  },
  addIconText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  storyUsername: {
    fontSize: 12,
    marginTop: 5,
    color: "#1d3557",
    textAlign: "center",
  },
});


export default HomeScreen;
