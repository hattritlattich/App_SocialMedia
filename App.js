import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AppNavigator from './navigation/AppNavigator';  // Import AppNavigator để dùng thanh công cụ dưới
import LoginScreen from './screens/LoginScreen';  // Màn hình đăng nhập
import RegisterScreen from './screens/RegisterScreen';  // Màn hình đăng ký
import { ToastProvider } from './components/ToastContext';  // Import ToastProvider from your context file

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    // Wrap the app with ToastProvider
    <ToastProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          {/* Màn hình đăng nhập */}
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }}  // Không hiển thị header trong màn hình đăng nhập
          />
          {/* Màn hình đăng ký */}
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen} 
            options={{ headerShown: false }}  // Không hiển thị header trong màn hình đăng ký
          />
          {/* Màn hình chính với thanh công cụ dưới */}
          <Stack.Screen 
            name="AppNavigator" 
            component={AppNavigator} 
            options={{ headerShown: false }}  // Ẩn header khi điều hướng đến AppNavigator
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ToastProvider>
  );
};
