import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { db } from "../db/firebaseConfig"; // Firebase Firestore setup
import { collection, addDoc, doc, setDoc, Timestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Firebase Authentication import
import * as ImageManipulator from "expo-image-manipulator";

const cropImageTo3x3 = async (uri) => {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ crop: { originX: 0, originY: 0, width: 300, height: 300 } }], // Kích thước tỷ lệ 3:3
      { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
    );
    return manipResult.uri; 
  } catch (error) {
    console.error("Lỗi khi cắt ảnh:", error);
    throw error;
  }
};


const uploadMediaToCloudinary = async (uri) => {
  const cloudinaryUrl = "https://api.cloudinary.com/v1_1/dsxwjrowu/upload"; 
  formData.append("file", { uri, type: "image/jpeg", name: "media.jpg" });
  formData.append("upload_preset", "my_upload_preset"); 

  try {
    const response = await fetch(cloudinaryUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Lỗi khi tải media lên Cloudinary");
    }

    const data = await response.json();
    return data.secure_url; // Trả về URL của media đã tải lên
  } catch (error) {
    console.error("Upload Error:", error);
    throw error;
  }
};

export default function PostCreateScreen() {
  const [content, setContent] = useState(""); // Nội dung bài viết
  const [media, setMedia] = useState([]); // Mảng chứa URI của media

  const auth = getAuth();
  const user = auth.currentUser;
  const userId = user ? user.uid : null;

  const pickMedia = async () => {
    const status = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!status.granted) {
      alert("Cần cấp quyền truy cập thư viện!");
      return;
    }

    Alert.alert("Chọn loại Media", "Bạn muốn chọn ảnh hay video?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Chọn ảnh",
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [3, 3],
            quality: 1,
          });
          if (!result.canceled) {
            setMedia((prevMedia) => [...prevMedia, result.assets[0].uri]);
          }
        },
      },
      {
        text: "Chọn video",
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["videos"],
            quality: 1,
          });
          if (!result.canceled) {
            setMedia((prevMedia) => [...prevMedia, result.assets[0].uri]);
          }
        },
      },
    ]);
  };

  const uploadPost = async () => {
    if (!content && media.length === 0) {
      alert("Hãy nhập nội dung hoặc chọn ít nhất một media!");
      return;
    }

    if (!userId) {
      alert("Bạn cần đăng nhập để đăng bài!");
      return;
    }

    try {
      let mediaUrls = [];

      for (const uri of media) {
        const url = await uploadMediaToCloudinary(uri);
        mediaUrls.push(url);
      }

      const postRef = doc(collection(db, "posts"));
      const postId = postRef.id;

      await setDoc(postRef, {
        postId,
        uid: userId,
        content,
        mediaUrls,
        likesCount: 0,
        commentsCount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      setContent("");
      setMedia([]);
      alert("Đã đăng bài thành công!");
    } catch (error) {
      console.error("Lỗi khi đăng bài:", error);
      alert("Có lỗi xảy ra, vui lòng thử lại.");
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Bạn đang nghĩ gì?"
        value={content}
        onChangeText={setContent}
        multiline
      />
      <ScrollView
        horizontal={false}
        contentContainerStyle={styles.mediaScroll} // Using contentContainerStyle to apply flexWrap
      >
        {media.map((uri, index) => (
          <View key={index} style={styles.mediaContainer}>
            <Image source={{ uri }} style={styles.media} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => {
                setMedia((prevMedia) => prevMedia.filter((item) => item !== uri));
              }}
            >
              <Text style={styles.removeButtonText}>X</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity style={styles.pickButton} onPress={pickMedia}>
        <Text style={styles.pickButtonText}>Chọn ảnh</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.uploadButton} onPress={uploadPost}>
        <Text style={styles.uploadButtonText}>Đăng bài viết</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f8f8" },
  headerText: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#2c3e50" },
  input: {
    height: 120,
    borderColor: "#dcdcdc",
    borderWidth: 1,
    marginBottom: 15,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#fff",
    textAlignVertical: "top",
    fontSize: 16,
  },
  mediaScroll: { marginBottom: 15, flexDirection: "row", flexWrap: "wrap", paddingVertical: 10 },
  mediaContainer: { width: "32%", marginBottom: 10, position: "relative" },
  media: {
    width: "100%",
    height: 120,
    borderRadius: 15,
    backgroundColor: "#dcdcdc",
  },
  removeButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "#e74c3c",
    borderRadius: 20,
    padding: 5,
  },
  removeButtonText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  pickButton: {
    backgroundColor: "#3498db",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  pickButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  uploadButton: {
    backgroundColor: "#2ecc71",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
  },
  uploadButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
