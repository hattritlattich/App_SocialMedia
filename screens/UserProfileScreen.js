import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, Image, TouchableOpacity, StyleSheet, Modal, FlatList, ActivityIndicator, Dimensions } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { db } from "../db/firebaseConfig";
import { doc, setDoc, getDoc, Timestamp, collection, query, where, getDocs, deleteDoc,updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const screenWidth = Dimensions.get("window").width;

const UserProfileScreen = ({ route }) => {
  const { user } = route.params; // Get user data from navigation params
  const currentUserId = getAuth().currentUser?.uid; // Get current logged-in user's ID
  const [isFollowing, setIsFollowing] = useState(false); // Following state
  const [followersCount, setFollowersCount] = useState(user.followersCount); // Followers count
  const [posts, setPosts] = useState([]); // User's posts
  const [loading, setLoading] = useState(true); // Loading state
  const [modalVisible, setModalVisible] = useState(false); // Modal visibility for followers/following list
  const [modalData, setModalData] = useState([]); // Data for modal (followers or following)
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false); // Confirmation modal state
  const [isPrivate, setIsPrivate] = useState(user.isPrivate); // Kiểm tra quyền riêng tư
  const navigation = useNavigation(); 
  
  const fetchUserData = async () => {
    if (currentUserId) {
      const userRef = doc(db, "users", currentUserId);
      try {
        const userSnapshot = await getDoc(userRef);
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
        
        } else {
          console.log("User not found in Firestore");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    }
  };
  
  const handleFollow = async () => {
    if (!currentUserId) return;
    
    if (isFollowing) {
      setConfirmationModalVisible(true); // Show confirmation modal if already following
    } else {
      performFollowAction(); // If not following, perform follow action
    }
  };
  
  const performFollowAction = async () => {
    const followerDocRef = doc(db, "followers", `${currentUserId}_${user.id}`);
    const profileRef = doc(db, "users", user.id);
    const currentUserRef = doc(db, "users", currentUserId);
  
    const newFollowingState = !isFollowing;
    setIsFollowing(newFollowingState); 
    setFollowersCount((prev) => (newFollowingState ? prev + 1 : prev - 1)); 
  
    try {
      const followDoc = await getDoc(followerDocRef);
      const userSnapshot = await getDoc(profileRef);
      const currentSnapshot = await getDoc(currentUserRef);
  
      if (!userSnapshot.exists() || !currentSnapshot.exists()) {
        throw new Error("User data not found");
      }
  
      const currentFollowers = userSnapshot.data().followersCount || 0;
      const currentFollowing = currentSnapshot.data().followingCount || 0;
  
      if (followDoc.exists()) {
        await deleteDoc(followerDocRef);
        await updateDoc(profileRef, { followersCount: currentFollowers - 1 });
        await updateDoc(currentUserRef, { followingCount: currentFollowing - 1 });
      } else {
        await setDoc(followerDocRef, {
          followerId: currentUserId,
          followedId: user.id,
          createdAt: Timestamp.now(),
        });
        await updateDoc(profileRef, { followersCount: currentFollowers + 1 });
        await updateDoc(currentUserRef, { followingCount: currentFollowing + 1 });
      }
    } catch (error) {
      console.error("Error updating follow status:", error);
  
      setIsFollowing((prevState) => !prevState);
      setFollowersCount((prev) => (isFollowing ? prev + 1 : prev - 1)); 
    }
  };
  
  
  
  
  // Kiểm tra trạng thái theo dõi khi load trang
  const checkFollowingStatus = async () => {
    if (!currentUserId) return;
  
    const followRef = doc(db, "followers", `${currentUserId}_${user.id}`);
    try {
      const followDoc = await getDoc(followRef);
      setIsFollowing(followDoc.exists());
    } catch (error) {
      console.error("Lỗi khi kiểm tra trạng thái theo dõi:", error);
    }
  };
  

  // Fetch posts made by the user
  const fetchPosts = async () => {
    if (currentUserId) {
      const postsRef = collection(db, "posts");
      const q = query(postsRef, where("uid", "==", user.id)); // Fetch posts by the user
      try {
        const querySnapshot = await getDocs(q);
        const postsData = querySnapshot.docs
          .map((doc) => ({
            ...doc.data(),
            postId: doc.id,
          }))
          .filter((post) => post.mediaUrls && post.mediaUrls.length > 0) // Filter posts that have images
          .sort((a, b) => b.createdAt - a.createdAt); // Sort posts by createdAt (most recent first)
  
        setPosts(postsData); // Set posts data
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    }
  };
  
  

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      checkFollowingStatus(); // Kiểm tra trạng thái theo dõi
      fetchUserData(); // Lấy dữ liệu người dùng
      fetchPosts(); // Lấy bài viết của người dùng
    }, [])
  );
  
  
  const handleChatPress = () => {
    // Get sender's ID (current user)
    const senderId = getAuth().currentUser?.uid;
  
    if (!senderId) {
      console.error("Sender ID is missing");
      return;
    }
  
    // Pass the recipient's data along with the sender's ID
    navigation.navigate("MessageScreen", {
      recipientId: user.id,
      recipientName: user.fullName,
      recipientProfilePicture: user.profilePicture,
      senderId: senderId,  // Include sender ID here
    });
  };
  
  
  // Render each post item
  const renderPostItem = ({ item }) => (
    <View style={styles.postItem}>
      {item.mediaUrls && item.mediaUrls.length > 0 ? (
        item.mediaUrls.map((url, index) => (
          <Image
            key={index}
            source={{ uri: url }}
            style={styles.postImage}
            resizeMode="cover"
          />
        ))
      ) : (
        <Text>No images available</Text>
      )}
    </View>
  );
  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#3498db" style={styles.loader} />
      ) : (
        <>
          <View style={styles.avatarContainer}>
            <Image
              source={user.profilePicture ? { uri: user.profilePicture } : require("../assets/avatar.jpg")}
              style={styles.avatar}
            />
            <Text style={styles.fullNameText}>{user.fullName || "Full Name"}</Text>
          </View>

          <View style={styles.statsContainer}>
            <TouchableOpacity onPress={() => openModal("followers")} disabled={isPrivate}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{followersCount}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openModal("following")} disabled={isPrivate}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{user.followingCount}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </TouchableOpacity>
          </View>

          
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.followButton, isFollowing ? { backgroundColor: "#95a5a6" } : { backgroundColor: "#3498db" }]}
                  onPress={handleFollow}
                >
                  <Text style={styles.buttonText}>{isFollowing ? "Đang theo dõi" : "Theo dõi"}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.chatButton}onPress={handleChatPress}>
                  <Text style={styles.buttonText}>Nhắn tin</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareButton}>
                  <Ionicons name="person-add" size={20} color="white" />
                </TouchableOpacity>
              </View>
             {isPrivate ? (
        <View style={styles.privateAccountMessage}>
          <Text style={styles.privateAccountText}>Tài khoản riêng tư</Text>
        </View>
      ) : (
                
            <>
              <View style={styles.tabsContainer}>
                <TouchableOpacity style={[styles.tabItem, styles.leftTab]}>
                  <Ionicons name="grid" size={20} color="gray" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabItem}>
                  <Ionicons name="bookmark" size={20} color="gray" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabItem, styles.rightTab]}>
                  <Ionicons name="images" size={20} color="gray" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={posts}
                keyExtractor={(item) => item.postId}
                renderItem={renderPostItem}
                numColumns={3}
                columnWrapperStyle={styles.gridRow}
                contentContainerStyle={styles.postsContainer}
                ListEmptyComponent={() => (
                  <View style={styles.noPostsContainer}>
                    <Text style={styles.noPostsText}>Chưa có bài viết</Text>
                  </View>
                )}
              />
            </>
          )}

          <Modal visible={confirmationModalVisible} onRequestClose={() => setConfirmationModalVisible(false)}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalText}>Bạn có chắc chắn muốn hủy theo dõi?</Text>
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: "#e74c3c" }]}
                  onPress={() => {
                    performFollowAction(); // Unfollow action
                    setConfirmationModalVisible(false);
                  }}
                >
                  <Text style={styles.buttonText}>Hủy theo dõi</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: "#3498db" }]}
                  onPress={() => setConfirmationModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Hủy</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>{modalData.length > 0 ? `${modalData[0].type} của ${user.fullName}` : ""}</Text>
              <FlatList
                data={modalData}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <View style={styles.modalItem}>
                    <Image
                      source={item.profilePicture ? { uri: item.profilePicture } : require("../assets/avatar.jpg")}
                      style={styles.modalAvatar}
                    />
                    <Text style={styles.modalText}>{item.fullName}</Text>
                  </View>
                )}
              />
            </View>
          </Modal>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  avatarContainer: {
    alignItems: "center",  // Centering avatar and name
    marginTop: 20,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  fullNameText: {
    color: "#000000",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 8, 
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: 'gray',
  },
  followButton: {
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 20,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  postsContainer: {
    paddingHorizontal: 0,
  },
  postItem: {
    width: screenWidth / 3,
    height: screenWidth / 3,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "#DDDDDD",
  },
  postImage: {
    width: "100%",
    height: "100%",
  },
  tabsContainer: {
    flexDirection: "row",
    width: screenWidth,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    overflow: "hidden",
    marginHorizontal: 0,
    paddingHorizontal: 0,
    alignSelf: "center",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "#F8F9FA",
  },
  leftTab: {
    borderRightWidth: 1,
    borderRightColor: "#CCCCCC",
  },
  rightTab: {
    borderLeftWidth: 1,
    borderLeftColor: "#CCCCCC",
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  modalItem: {
    marginVertical: 10,
  },
  closeModalButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#3498db',
    borderRadius: 5,
    alignItems: 'center',
  },
  closeModalText: {
    color: '#fff',
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  followButton: {
    flex: 1,
    padding: 10,
    backgroundColor: "#3498db",
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 2,
  },
  chatButton: {
    flex: 1,
    padding: 10,
    backgroundColor: "#3498db",
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 2,
  },
  shareButton: {
    width: 40,
    height: 40,
    backgroundColor: "#3498db",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center', // Center vertically
    alignItems: 'center', // Center horizontally
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  modalContent: {
    width: '80%', // Modal width (80% of screen width)
    maxHeight: 300, // Maximum height for the modal
    backgroundColor: '#fff',
    borderRadius: 10, // Rounded corners
    padding: 20,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20, // Space between text and buttons
    textAlign: 'center', // Center the text
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly', // Even space between buttons
    width: '100%',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5, // Space between buttons
    minWidth: 100, // Minimum width for buttons
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
  },
  noPostsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noPostsText: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
  },
});

export default UserProfileScreen;
