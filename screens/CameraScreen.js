import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Alert, Platform, PermissionsAndroid } from 'react-native';
import { RNCamera } from 'react-native-camera';  // Import đúng từ react-native-camera

const CameraScreen = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const cameraRef = useRef(null);

  // Hiển thị thông báo yêu cầu cấp quyền camera
  const askForPermission = () => {
    if (Platform.OS === 'android') {
      PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA)
        .then(result => {
          if (result === PermissionsAndroid.RESULTS.GRANTED) {
            setHasPermission(true);
          } else {
            setHasPermission(false);
            Alert.alert('Lỗi', 'Không có quyền truy cập camera!');
          }
        });
    } else {
      RNCamera.requestPermissionsAsync().then(({ status }) => {
        if (status === 'granted') {
          setHasPermission(true);
        } else {
          setHasPermission(false);
          Alert.alert('Lỗi', 'Không có quyền truy cập camera!');
        }
      });
    }
  };

  useEffect(() => {
    if (hasPermission === null) {
      askForPermission(); // Chỉ yêu cầu quyền camera khi bắt đầu màn hình
    }
  }, [hasPermission]);

  if (hasPermission === null) {
    return <View style={styles.container}><Text>Đang yêu cầu quyền truy cập camera...</Text></View>;
  }

  if (hasPermission === false) {
    return <View style={styles.container}><Text>Không có quyền truy cập camera!</Text></View>;
  }

  return (
    <View style={styles.container}>
      <RNCamera style={styles.camera} ref={cameraRef} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
});

export default CameraScreen;
