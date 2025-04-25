import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { db } from "../db/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  getDoc,
  doc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

const CommentsScreen = ({ route }) => {
  const { postId } = route.params;
  const [comments, setComments] = useState({});
  const [collapsedComments, setCollapsedComments] = useState({});
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const user = auth.currentUser;

  const fetchUsername = async (uid) => {
    try {
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          username: userData.username || "Người dùng ẩn danh",
          profilePicture: userData.profilePicture || null,
        };
      }
      return { username: "Người dùng ẩn danh", profilePicture: null };
    } catch (error) {
      console.error("Error fetching username:", error.message);
      return { username: "Người dùng ẩn danh", profilePicture: null };
    }
  };

  const fetchComments = async () => {
    try {
      const commentsQuery = query(
        collection(db, "comments"),
        where("postId", "==", postId)
      );
      const snapshot = await getDocs(commentsQuery);
      const loadedComments = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const commentData = doc.data();
          const { username, profilePicture } = await fetchUsername(commentData.uid);
          return {
            id: doc.id,
            ...commentData,
            username,
            profilePicture,
            createdAt: commentData.createdAt?.toDate(),
          };
        })
      );

      const groupedComments = loadedComments.reduce((acc, comment) => {
        const parentId = comment.parentId || "root";
        acc[parentId] = acc[parentId] || [];
        acc[parentId].push(comment);
        return acc;
      }, { root: [] }); // Ensure root exists if no comments

      setComments(groupedComments);

      const initialCollapseState = Object.keys(groupedComments).reduce(
        (acc, key) => {
          if (key !== "root") acc[key] = true;
          return acc;
        },
        {}
      );
      setCollapsedComments(initialCollapseState);
    } catch (error) {
      console.error("Error fetching comments:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (parentId = null) => {
    if (!newComment.trim()) return;

    try {
      await addDoc(collection(db, "comments"), {
        postId,
        uid: user.uid,
        text: newComment.trim(),
        createdAt: new Date(),
        parentId,
      });
      setNewComment("");
      setReplyTo(null);
      await fetchComments();
    } catch (error) {
      console.error("Error adding comment:", error.message);
    }
  };

  const toggleCollapse = (id) => {
    setCollapsedComments((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const renderComment = (item, level = 0) => {
    const timeAgo = item.createdAt
      ? formatDistanceToNow(item.createdAt, { addSuffix: true, locale: vi })
      : "Vừa xong";
  
    const isCollapsed = collapsedComments[item.id];
    let childComments = comments[item.id] || [];
  
    return (
      <View
        style={[
          styles.comment,
          { marginLeft: level === 1 ? 20 : level === 2 ? 40 : 0 },
        ]}
      >
        <View style={styles.commentRow}>
          <Image
            source={
              item.profilePicture
                ? { uri: item.profilePicture }
                : require("../assets/avatar.jpg")
            }
            style={styles.avatar}
          />
          <View style={styles.commentContent}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.commentText}>{item.text}</Text>
            <View style={styles.metaSection}>
              <Text style={styles.timestamp}>{timeAgo}</Text>
              <TouchableOpacity onPress={() => setReplyTo(item)}>
                <Text style={styles.replyButtonText}>Trả lời</Text>
              </TouchableOpacity>
              {childComments.length > 0 && (
                <TouchableOpacity onPress={() => toggleCollapse(item.id)}>
                  <Text style={styles.collapseText}>
                    {isCollapsed
                      ? `Xem ${childComments.length} bình luận`
                      : "Ẩn bình luận"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
  
        {!isCollapsed &&
          childComments.map((childComment) => {
            return (
              <View key={childComment.id}>
                {renderComment(childComment, level + 1)}
              </View>
            );
          })}
      </View>
    );
  };
  

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0095f6" style={styles.loader} />
      ) : (
        <>
          {comments["root"]?.length === 0 ? (
            <View style={styles.noCommentsContainer}>
              <Text style={styles.noCommentsText}>Chưa có bình luận nào</Text>
            </View>
          ) : (
            <FlatList
              data={comments["root"] || []}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => renderComment(item)}
              style={styles.commentsList}
            />
          )}
        </>
      )}
      <View style={styles.inputContainer}>
        {replyTo && (
          <View style={styles.replyInfo}>
            <Text style={styles.replyText}>
              Đang trả lời {replyTo.username}
            </Text>
            <TouchableOpacity onPress={() => setReplyTo(null)}>
              <Text style={styles.cancelReplyText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        )}
        <TextInput
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Viết bình luận..."
          style={styles.input}
        />
        <TouchableOpacity
          onPress={() => handleAddComment(replyTo?.id)}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>Gửi</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noCommentsText: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    fontSize: 16,
    color: "#888",
    marginTop: 20,
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 10,
  },
  comment: {
    paddingVertical: 10,
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  commentContent: {
    flex: 1,
  },
  username: {
    fontWeight: "bold",
    color: "#000",
    fontSize: 14,
  },
  commentText: {
    color: "#333",
    fontSize: 14,
    marginTop: 2,
  },
  metaSection: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  timestamp: {
    fontSize: 12,
    color: "#666",
    marginRight: 15,
  },
  replyButtonText: {
    fontSize: 12,
    color: "#2995ff",
  },
  collapseText: {
    fontSize: 12,
    color: "#2995ff",
    marginLeft: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 14,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: "#0095f6",
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  replyInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  replyText: {
    fontSize: 12,
    color: "#000",
  },
  cancelReplyText: {
    fontSize: 12,
    color: "#ff0000",
    marginLeft: 10,
  },
  noCommentsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  noCommentsText: {
    fontSize: 20,
    color: "#888",
  },
});

export default CommentsScreen;
