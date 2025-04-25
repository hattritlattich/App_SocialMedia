import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect,useNavigation } from '@react-navigation/native';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  FlatList,
  ActivityIndicator,
  Dimensions,
  TextInput ,
  Switch 
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { db } from "../db/firebaseConfig";
import { doc, setDoc, getDoc, Timestamp, collection, query, where, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";


const uploadMediaToCloudinary = async (uri) => {
  const cloudinaryUrl = "https://api.cloudinary.com/v1_1/dsxwjrowu/upload";
  const formData = new FormData();
  formData.append("file", { uri, type: "image/jpeg", name: "avatar.jpg" });
  formData.append("upload_preset", "my_upload_preset");

  try {
    const response = await fetch(cloudinaryUrl, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error("Lỗi khi tải avatar lên Cloudinary");
    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Upload Error:", error);
    throw error;
  }
};

const screenWidth = Dimensions.get("window").width;
const ProfileScreen = () => {
  const [user, setUser] = useState(null);
  const navigation = useNavigation();  // Use useNavigation here
  const [photoUrl, setPhotoUrl] = useState(null);
  const [userName, setUserName] = useState("");
  const [fullName, setFullName] = useState("");
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newBio, setNewBio] = useState("");
  const [newIsPrivate, setNewIsPrivate] = useState(false);

  const fetchUserData = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (currentUser) {
      const userRef = doc(db, "users", currentUser.uid);
      try {
        const docSnapshot = await getDoc(userRef);
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          setUser(userData);
          setPhotoUrl(userData.profilePicture || null);
          setUserName(userData.username || "");
          setFullName(userData.fullName || "");
          setFollowers(userData.followersCount || 0);
          setFollowing(userData.followingCount || 0);
        } else {
          console.log("Không tìm thấy người dùng trong Firestore");
        }
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu người dùng:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const fetchPosts = async () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  if (currentUser) {
    const postsRef = collection(db, "posts");
    const q = query(postsRef, where("uid", "==", currentUser.uid));
    try {
      const querySnapshot = await getDocs(q);
      const postsData = querySnapshot.docs
        .map((doc) => {
          const postData = doc.data();
          // Add the post ID and timestamp (assuming 'createdAt' is a timestamp)
          return { ...postData, postId: doc.id, createdAt: postData.createdAt };
        })
        .filter((post) => post.mediaUrls && post.mediaUrls.length > 0);
      
      // Sort posts by 'createdAt' in descending order (newest first)
      const sortedPosts = postsData.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      setPosts(sortedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  }
};


  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchUserData();
      fetchPosts();
    }, [])
  );

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Cần cấp quyền truy cập thư viện!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled && result.assets) {
      try {
        const uploadedImageUrl = await uploadMediaToCloudinary(result.assets[0].uri);
        setPhotoUrl(uploadedImageUrl);
      } catch (error) {
        alert("Lỗi khi tải ảnh lên.");
      }
    }
  };
  const openEditModal = () => {
    setNewUsername(userName);
    setNewFullName(fullName);
    setNewBio(user?.bio || "");
    setNewIsPrivate(user?.isPrivate || false);
    setEditModalVisible(true);
  };
  const saveProfileChanges = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
  
    if (currentUser) {
      try {
        // Upload new avatar if selected
        let uploadedPhotoUrl = photoUrl; // Default to current avatar URL if no new photo is selected
        if (photoUrl && photoUrl.uri) {
          uploadedPhotoUrl = await uploadMediaToCloudinary(photoUrl.uri);
        }
  
        // Save the profile changes including avatar
        const userRef = doc(db, "users", currentUser.uid);
        await setDoc(userRef, {
          username: newUsername,
          fullName: newFullName,
          bio: newBio,
          isPrivate: newIsPrivate,
          profilePicture: uploadedPhotoUrl, // Save the new or existing avatar
        }, { merge: true });
  
        // Update UI state
        setUserName(newUsername);
        setFullName(newFullName);
        setUser({ ...user, bio: newBio, isPrivate: newIsPrivate, profilePicture: uploadedPhotoUrl });
        setEditModalVisible(false);
      } catch (error) {
        console.error("Error saving profile:", error);
        alert("Không thể lưu thay đổi, vui lòng thử lại.");
      }
    }
  };
  
  
  const openModal = async (type) => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (currentUser) {
      const userRef = doc(db, "users", currentUser.uid);
      try {
        const docSnapshot = await getDoc(userRef);
        if (docSnapshot.exists()) {
          let data = [];

          if (type === "followers") {
            const followersRef = collection(db, "followers");
            const q = query(followersRef, where("followedId", "==", currentUser.uid));
            const querySnapshot = await getDocs(q);
            for (const docSnap of querySnapshot.docs) {
              const followerId = docSnap.data().followerId;
              const userSnap = await getDoc(doc(db, "users", followerId));
              if (userSnap.exists()) {
                data.push(userSnap.data());
              }
            }
          } else if (type === "following") {
            const followersRef = collection(db, "followers");
            const q = query(followersRef, where("followerId", "==", currentUser.uid));
            const querySnapshot = await getDocs(q);
            for (const docSnap of querySnapshot.docs) {
              const followedId = docSnap.data().followedId;
              const userSnap = await getDoc(doc(db, "users", followedId));
              if (userSnap.exists()) {
                data.push(userSnap.data());
              }
            }
          }

          setModalData(data);
          setModalVisible(true);
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách người theo dõi hoặc đang theo dõi:", error);
      }
    }
  };

  const renderPostItem = ({ item }) => (
    <TouchableOpacity
      style={styles.postItem}
      onPress={() => {
        navigation.navigate('PostDetailScreen', { postId: item.postId });
      }}
    >
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
    </TouchableOpacity>
  );
  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#3498db" style={styles.loader} />
      ) : (
        <>
          <View style={styles.avatarContainer}>
            <Image
              source={photoUrl ? { uri: photoUrl } : require("../assets/avatar.jpg")}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.editAvatarIcon} onPress={pickMedia}>
              <Ionicons name="camera" size={20} color="white" />
            </TouchableOpacity>
            <Text style={styles.fullNameText}>{fullName || "Tên đầy đủ"}</Text>
            <Text style={styles.bioText}>{user?.bio || " "}</Text>
          </View>

          <View style={styles.statsContainer}>
            <TouchableOpacity onPress={() => openModal("followers")}> 
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{followers}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openModal("following")}> 
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{following}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.editProfileButton} onPress={openEditModal}>
            <Text style={styles.buttonText}>Chỉnh sửa trang cá nhân</Text>
          </TouchableOpacity>
            <TouchableOpacity style={styles.shareProfileButton}>
              <Text style={styles.buttonText}>Chia sẻ trang cá nhân</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addUserButton}>
              <Ionicons name="person-add" size={20} color="white" />
            </TouchableOpacity>
          </View>

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
          />

          <Modal
            visible={modalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>
                  {modalData.length ? "Danh sách" : "Chưa có người nào"}
                </Text>
                <FlatList
                  data={modalData}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item }) => (
                    <View style={styles.modalItem}>
                      <Text style={styles.modalItemText}>{item.fullName}</Text>
                    </View>
                  )}
                />
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.closeModalButton}
                >
                  <Text style={styles.closeModalText}>Đóng</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          <Modal
            visible={editModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setEditModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Chỉnh sửa trang cá nhân</Text>

                <Text style={styles.inputLabel}>Tên người dùng</Text>
                <TextInput
                  style={styles.input}
                  value={newUsername}
                  onChangeText={setNewUsername}
                />

                <Text style={styles.inputLabel}>Họ và tên</Text>
                <TextInput
                  style={styles.input}
                  value={newFullName}
                  onChangeText={setNewFullName}
                />

                <Text style={styles.inputLabel}>Tiểu sử</Text>
                <TextInput
                  style={styles.input}
                  value={newBio}
                  onChangeText={setNewBio}
                  multiline
                />

                <View style={styles.switchRow}>
                  <Text style={styles.inputLabel}>Tài khoản riêng tư</Text>
                  <Switch
                    value={newIsPrivate}
                    onValueChange={setNewIsPrivate}
                  />
                </View>

                <View style={styles.modalButtonRow}>
                  <TouchableOpacity
                    onPress={saveProfileChanges}
                    style={styles.saveButton}
                  >
                    <Text style={styles.buttonText}>Lưu</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setEditModalVisible(false)}
                    style={styles.cancelButton}
                  >
                    <Text style={styles.buttonText}>Hủy</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
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
  editAvatarButton: {
    backgroundColor: "#007BFF",
    borderRadius: 20,
    padding: 8,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#EEEEEE",
    paddingVertical: 10,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "bold",
  },
  statLabel: {
    color: "#555555",
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  editProfileButton: {
    flex: 1,
    padding: 10,
    backgroundColor: "#3498db",
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 2,
  },
  shareProfileButton: {
    flex: 1,
    padding: 10,
    backgroundColor: "#3498db",
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 2,
  },
  addUserButton: {
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
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: 300,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#000000",
  },
  modalItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#DDDDDD",
  },
  modalItemText: {
    fontSize: 16,
    color: "#000000",
  },
  closeModalButton: {
    marginTop: 12,
    padding: 10,
    backgroundColor: "#007BFF",
    borderRadius: 8,
    alignItems: "center",
  },
  closeModalText: {
    color: "white",
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
  input: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: "#F8F8F8",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#000000",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 8,
    width: "45%",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#dc3545",
    padding: 10,
    borderRadius: 8,
    width: "45%",
    alignItems: "center",
  },
  bioText: {
    color: "#555555",
    fontSize: 14,
    marginTop: 4,
    textAlign: "center", // Để căn giữa nội dung
    paddingHorizontal: 20, // Tạo khoảng cách nếu tiểu sử dài
  },
  editAvatarIcon: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "#007BFF",
    borderRadius: 20,
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 5,
  },
});

export default ProfileScreen;
