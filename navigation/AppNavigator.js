import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from 'react-native-vector-icons'; 
import { Ionicons } from '@expo/vector-icons'; 
import { TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native'; 
import HomeScreen from '../screens/HomeScreen'; 
import SearchScreen from '../screens/SearchScreen'; 
import CreatePostScreen from '../screens/CreatePostScreen'; 
import NotificationsScreen from '../screens/NotificationsScreen'; 
import ProfileScreen from '../screens/ProfileScreen'; 
import SettingsScreen from '../screens/SettingsScreen'; // Đảm bảo import SettingsScreen
import UserProfileScreen from '../screens/UserProfileScreen';
import LikeScreen from '../screens/LikeScreen';
import CommentsScreen from "../screens/CommentsScreen";
import MessageScreen from "../screens/MessageScreen";
import ChatListScreen from "../screens/ChatListScreen";
import ProfileFollowersScreen from '../screens/ProfileFollowersScreen';
import CameraScreen from '../screens/CameraScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import EditPostScreen from "../screens/EditPostScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
   
      <Stack.Navigator initialRouteName="Tabs">
        {/* Đảm bảo rằng màn hình Settings đã được khai báo trong StackNavigator */}
        <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Cài đặt' }}  />
        <Stack.Screen name="LikeScreen" component={LikeScreen} options={{ title: 'Danh sách lượt thích' }} />
        <Stack.Screen name="CommentsScreen" component={CommentsScreen} options={{ title: 'Bình luận' }}  />
        <Stack.Screen name="UserProfileScreen" component={UserProfileScreen} options={{ title: 'Hồ sơ cá nhân' }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Hồ sơ của bạn' }} />
        <Stack.Screen name="ProfileFollowersScreen" component={ProfileFollowersScreen} />
        <Stack.Screen name="CameraScreen" component={CameraScreen} />
        <Stack.Screen name="ChatList" component={ChatListScreen} options={{ title: "Danh sách tin nhắn" }} />
        <Stack.Screen name="PostDetailScreen" component={PostDetailScreen} />
        <Stack.Screen name="EditPostScreen" component={EditPostScreen} />
        <Stack.Screen name="MessageScreen" component={MessageScreen} options={{ title: "Tin nhắn" }} />
      </Stack.Navigator>

  );
};

const TabNavigator = () => {
  const navigation = useNavigation();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: 'gray',
        tabBarLabel: "",  
      }}
    >
       <Tab.Screen
    name="Home"
    component={HomeScreen}
    options={{
      tabBarIcon: ({ color, size }) => (
        <MaterialCommunityIcons name="home" color={color} size={size} />
      ),
      headerTitle: "Trang chủ",
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('ChatListScreen')}>
          <Ionicons
            name="chatbubble-ellipses"
            size={24}
            color="black"
            style={{ marginRight: 15 }}
          />
        </TouchableOpacity>
      ),
    }}
  />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="magnify" color={color} size={size} />
          ),
          headerTitle: "Tìm Kiếm", 
        }}
      />
      <Tab.Screen
        name="Create"
        component={CreatePostScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="plus-circle" color={color} size={size} />
          ),
          headerTitle: "Tạo bài viết", 
        }}
      />
      
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" color={color} size={size} />
          ),
          headerTitle: "Trang cá nhân", 
          headerRight: () => (
            <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
              <Ionicons name="ellipsis-horizontal" size={24} color="black" style={{ marginRight: 15 }} />
            </TouchableOpacity>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default AppNavigator;
