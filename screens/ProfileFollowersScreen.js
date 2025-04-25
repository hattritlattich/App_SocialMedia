import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { db } from "../db/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const ProfileFollowersScreen = ({ route }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { type } = route.params; // 'followers' or 'following'

  const fetchFollowers = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (currentUser) {
      const followersRef = collection(db, "followers");
      const q = query(
        followersRef,
        where(type === "followers" ? "followedId" : "followerId", "==", currentUser.uid)
      );
      try {
        const querySnapshot = await getDocs(q);
        const userList = [];
        for (const docSnap of querySnapshot.docs) {
          const userId = type === "followers" ? docSnap.data().followerId : docSnap.data().followedId;
          const userSnap = await getDoc(doc(db, "users", userId));
          if (userSnap.exists()) {
            userList.push(userSnap.data());
          }
        }
        setData(userList);
      } catch (error) {
        console.error("Error fetching followers:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchFollowers();
  }, [type]);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#3498db" style={styles.loader} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.itemText}>{item.fullName}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  item: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  itemText: {
    fontSize: 16,
    color: "#333",
  },
});

export default ProfileFollowersScreen;
