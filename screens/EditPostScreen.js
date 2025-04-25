import React, { useState, useEffect } from "react";
import { View, TextInput, Image, Button, StyleSheet, Alert, ScrollView } from "react-native";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../db/firebaseConfig";

const EditPostScreen = ({ route, navigation }) => {
  // Lấy dữ liệu từ route params
  const { postId, currentContent = "No content available.", currentImageUrl = null } = route.params || {};

  // State để quản lý nội dung đang chỉnh sửa và hình ảnh
  const [content, setContent] = useState(currentContent);
  const [imageUrl, setImageUrl] = useState(currentImageUrl);

  useEffect(() => {
    // Kiểm tra nếu route.params có giá trị
    if (!postId) return;

    const fetchPostDetails = async () => {
      try {
        const postRef = doc(db, "posts", postId);
        const postSnap = await getDoc(postRef);

        if (postSnap.exists()) {
          const postData = postSnap.data();
          setContent(postData.content || "No content available.");
          setImageUrl(postData.imageUrl || null);
        } else {
          console.error("No such document!");
        }
      } catch (error) {
        console.error("Error fetching post details:", error.message);
        Alert.alert("Error", "Failed to fetch post details.");
      }
    };

    // Nếu không có nội dung, gọi API để lấy chi tiết bài đăng
    if (!currentContent) {
      fetchPostDetails();
    }
  }, [postId, currentContent]);

  const handleSave = async () => {
    try {
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, { content });
      Alert.alert("Success", "Post updated successfully!");
      navigation.goBack();
    } catch (error) {
      console.error("Error updating post:", error.message);
      Alert.alert("Error", "Failed to update post.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Hiển thị hình ảnh */}
      <Image
        source={imageUrl ? { uri: imageUrl } : require("../assets/avatar.jpg")}
        style={styles.image}
      />
      {/* Hiển thị nội dung để chỉnh sửa */}
      <TextInput
        style={styles.input}
        multiline
        placeholder="Edit your content here..."
        value={content}
        onChangeText={setContent}
      />
      {/* Nút lưu thay đổi */}
      <Button title="Save Changes" onPress={handleSave} color="#1d3557" />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
    resizeMode: "cover",
  },
  input: {
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    backgroundColor: "#fff",
    height: 150,
    textAlignVertical: "top",
    fontSize: 16,
    lineHeight: 24,
  },
});

export default EditPostScreen;
