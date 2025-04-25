import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '../db/firebaseConfig'

const NotificationsScreen = ({ user }) => {
  const notifications = [
    { id: '1', type: 'follow_request', followerId: 'user123' },
    { id: '2', type: 'like', senderId: 'user456' },
    { id: '3', type: 'comment', senderId: 'user789' },
  ]; // Thêm dữ liệu mẫu hoặc dữ liệu từ API

  const handleAcceptFollowRequest = async (followerId) => {
    try {
      const followerDocRef = doc(db, "followers", `${followerId}_${user.id}`);
      const profileRef = doc(db, "users", user.id); // profileRef
      const currentUserRef = doc(db, "users", followerId); // currentUserRef

      const followDoc = await getDoc(followerDocRef);
      if (followDoc.exists()) {
        await updateDoc(followerDocRef, { status: 'following' }); // Update status to 'following'
        await updateDoc(profileRef, { followersCount: user.followersCount + 1 }); // Increment the followers count
        await updateDoc(currentUserRef, { followingCount: user.followingCount + 1 }); // Increment the following count

        // Remove from pending requests
        await updateDoc(currentUserRef, { pendingFollowingRequests: arrayRemove(user.id) });

        console.log("Follow request accepted.");
      }
    } catch (error) {
      console.error("Error accepting follow request:", error);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.notificationItem}>
      <Text>{item.type === 'follow_request' ? 'Bạn có một yêu cầu theo dõi' : item.type}</Text>
      {item.type === 'follow_request' && (
        <TouchableOpacity onPress={() => handleAcceptFollowRequest(item.followerId)}>
          <Text style={styles.acceptButton}>Chấp nhận</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  notificationItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  acceptButton: {
    color: 'blue',
    textDecorationLine: 'underline',
  },
});

export default NotificationsScreen;
