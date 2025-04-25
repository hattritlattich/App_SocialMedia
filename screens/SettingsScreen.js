import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { getAuth, signOut } from "firebase/auth";

const SettingsScreen = ({ navigation }) => {
  const handleLogout = () => {
    const auth = getAuth();

    // Xác nhận trước khi đăng xuất
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất không?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Đồng ý",
          onPress: async () => {
            try {
              await signOut(auth);
              navigation.replace("Login"); // Điều hướng về màn hình đăng nhập
            } catch (error) {
              console.error("Lỗi khi đăng xuất:", error);
              Alert.alert("Lỗi", "Không thể đăng xuất, vui lòng thử lại sau.");
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Trang Cài Đặt</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Đăng Xuất</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: "#e74c3c",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 20,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default SettingsScreen;