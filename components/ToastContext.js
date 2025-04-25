// components/ToastContext.js
import React, { createContext, useState, useContext } from 'react';
import { ToastAndroid } from 'react-native';  // Sử dụng ToastAndroid cho Android, hoặc có thể sử dụng thư viện Toast cho cả iOS và Android

// Tạo context Toast
const ToastContext = createContext();

// ToastProvider để cung cấp context cho toàn bộ ứng dụng
export const ToastProvider = ({ children }) => {
  const [toastMessage, setToastMessage] = useState(null);

  // Hàm để hiển thị Toast message
  const showToast = (message) => {
    setToastMessage(message);
    // Hiển thị Toast
    ToastAndroid.show(message, ToastAndroid.LONG);  // Nếu bạn đang làm việc trên Android
    // Nếu bạn muốn hỗ trợ iOS, bạn có thể thay thế bằng một thư viện Toast khác, ví dụ 'react-native-toast-message'
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
    </ToastContext.Provider>
  );
};

// Hook để sử dụng Toast trong các component
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
