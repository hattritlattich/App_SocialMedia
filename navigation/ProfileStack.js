import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import ProfileScreen from "../screens/ProfileScreen";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // Sử dụng icon menu

const Stack = createStackNavigator();

const ProfileStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#6200ee", // Màu header
        },
        headerTintColor: "#fff", // Màu chữ
        headerTitleAlign: "center", // Căn giữa tiêu đề
      }}
    >
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={({ navigation }) => ({
          title: "Profile",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => {
                // Hành động khi nhấn nút menu (ví dụ: mở màn hình cài đặt)
                navigation.navigate("Settings");
              }}
              style={{ marginRight: 15 }}
            >
              <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
};

export default ProfileStack;
