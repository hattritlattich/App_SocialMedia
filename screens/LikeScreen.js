import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList, Text, Image, TouchableOpacity } from "react-native";
import { db } from "../db/firebaseConfig";
import { getDoc, doc, collection, query, where, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const LikeScreen = ({ route, navigation }) => {
  const { postId } = route.params; // Retrieve postId from navigation route params
  const [likesList, setLikesList] = useState([]); // State to hold the list of users who liked the post
  const [loading, setLoading] = useState(true); // Loading state
  const [currentUser, setCurrentUser] = useState(null); // Store the current user
  const [followedUsers, setFollowedUsers] = useState([]); // List of users that the current user follows
  const [refreshing, setRefreshing] = useState(false); // State to handle pull-to-refresh

  // Fetch the current logged-in user
  useEffect(() => {
    const auth = getAuth();
    setCurrentUser(auth.currentUser);
  }, []);

  // Fetch the list of users who liked the post
  const fetchLikesList = async () => {
    try {
      const likesQuery = query(
        collection(db, "likes"),
        where("postId", "==", postId) // Filter likes for the current postId
      );

      const snapshot = await getDocs(likesQuery);

      // Fetch user details for each like
      const users = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const likeData = docSnap.data();
          const userRef = doc(db, "users", likeData.uid);
          const userSnap = await getDoc(userRef);

          // Add user data only if it exists
          if (userSnap.exists()) {
            return { id: userSnap.id, ...userSnap.data() };
          }
          return null;
        })
      );

      setLikesList(users.filter((user) => user)); // Filter out null entries
    } catch (error) {
      console.error("Error fetching likes list:", error.message);
    } finally {
      setLoading(false); // Stop loading once data is fetched
      setRefreshing(false); // Stop refreshing after data load
    }
  };

  // Fetch the list of users the current user follows
  const fetchFollowedUsers = async () => {
    if (!currentUser) return;
    const followersQuery = query(
      collection(db, "followers"),
      where("followerId", "==", currentUser.uid)
    );
    const snapshot = await getDocs(followersQuery);
    const followed = snapshot.docs.map((doc) => doc.data().followedId);
    setFollowedUsers(followed);
  };

  // Fetch likes and followed users when the component mounts
  useEffect(() => {
    fetchLikesList();
    fetchFollowedUsers();
  }, [postId, currentUser]);

  // Navigate to the user's profile screen or the logged-in user's profile if they liked the post
  const openUserProfile = (user) => {
    if (currentUser && user.id === currentUser.uid) {
      navigation.navigate("Profile"); // Navigate to Profile
    } else {
      navigation.navigate("UserProfileScreen", { user }); // Navigate to UserProfileScreen
    }
  };

  // Handle follow/unfollow logic
  const handleFollowToggle = async (userId) => {
    const followRef = doc(db, "followers", `${currentUser.uid}_${userId}`);
    const followSnap = await getDoc(followRef);

    if (followSnap.exists()) {
      // If already following, unfollow
      await deleteDoc(followRef);
      setFollowedUsers(followedUsers.filter((id) => id !== userId));
    } else {
      // If not following, follow
      await setDoc(followRef, {
        followerId: currentUser.uid,
        followedId: userId,
        createdAt: new Date(),
      });
      setFollowedUsers([...followedUsers, userId]);
    }
  };

  // Render a single user's details
  const renderUser = ({ item }) => {
    if (item.id === currentUser.uid) {
      // Don't render the follow button for the current user
      return (
        <TouchableOpacity
          style={styles.userContainer}
          onPress={() => openUserProfile(item)} // Navigate to the user's profile
        >
          <Image
            source={item.profilePicture ? { uri: item.profilePicture } : require("../assets/avatar.jpg")}
            style={styles.userAvatar}
          />
          <Text style={styles.userName}>{item.username}</Text>
        </TouchableOpacity>
      );
    }

    const isFollowing = followedUsers.includes(item.id);

    return (
      <View style={styles.userContainer}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => openUserProfile(item)} // Navigate to the user's profile
        >
          <Image
            source={item.profilePicture ? { uri: item.profilePicture } : require("../assets/avatar.jpg")}
            style={styles.userAvatar}
          />
          <Text style={styles.userName}>{item.username}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.followButton, isFollowing && styles.followingButton]}
          onPress={() => handleFollowToggle(item.id)}
        >
          <Text style={styles.followButtonText}>
            {isFollowing ? "Đang theo dõi" : "Theo dõi"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Display a loading or empty state if needed
  const renderEmptyOrLoading = () => {
    if (loading) {
      return <Text style={styles.emptyText}>Đang tải...</Text>;
    }

    if (likesList.length === 0) {
      return <Text style={styles.emptyText}>Không có lượt thích nào</Text>;
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={likesList}
        keyExtractor={(item) => item.id} // Use user ID as the unique key
        renderItem={renderUser}
        ListEmptyComponent={renderEmptyOrLoading} // Show loading or empty message
        refreshing={refreshing} // Set refreshing state
        onRefresh={async () => {
          setRefreshing(true); // Set refreshing state to true when pulling down
          await fetchLikesList(); // Fetch data again
          await fetchFollowedUsers(); // Fetch followed users again
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    padding: 10,
  },
  userContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    justifyContent: "space-between", // This will ensure the space is evenly divided between name and button
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1, // Allow the name and avatar to take the remaining space
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "left",
    flex: 1, // Ensure the name doesn't collapse or shift its position
  },
  followButton: {
    backgroundColor: "#007bff",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  followingButton: {
    backgroundColor: "#6c757d",
  },
  followButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#888",
    marginTop: 20,
  },
});

export default LikeScreen;
