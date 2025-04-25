import React, { useState } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { TextInput, Button, Card, Title, Subheading } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { auth, createUserWithEmailAndPassword } from '../db/firebaseConfig';
import { db } from '../db/firebaseConfig';
import { doc, setDoc, collection, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Import the eye icon

const RegisterScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State for showing/hiding password
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // State for showing/hiding confirm password
  const navigation = useNavigation();

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      alert("Mật khẩu không khớp!");
      return;
    }

    // Password validation regex for at least one lowercase, one uppercase, one number, one special character, and minimum 8 characters
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/`~]).{8,}$/;

    if (!passwordRegex.test(password)) {
      alert("Mật khẩu phải chứa ít nhất một chữ in thường, một chữ in hoa, một số, một ký tự đặc biệt và có ít nhất 8 ký tự.");
      return;
    }

    // Validate username
    const usernameRegex = /^[a-z0-9._]{1,20}$/;
    if (!usernameRegex.test(name)) {
      Alert.alert(
        "Lỗi",
        "Tên tài khoản chỉ được chứa ký tự thường, không dấu, chỉ được dùng dấu . và _ , viết liền và tối đa 20 ký tự."
      );
      return;
    }

    try {
      // Kiểm tra username có bị trùng không
      const q = query(collection(db, "users"), where("username", "==", name));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        Alert.alert("Lỗi", "Tên tài khoản đã được sử dụng. Vui lòng chọn tên khác.");
        return;
      }

      // Tạo tài khoản Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Lưu thông tin người dùng vào Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        username: name,
        fullName: fullName,
        email: email,
        profilePicture: '',
        bio: '',
        followersCount: 0,
        followingCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isPrivate: false,
        lastLogin: serverTimestamp(),
      });

      console.log("Đăng ký thành công và thông tin người dùng đã được lưu vào Firestore.");
      navigation.navigate('Login');
    } catch (error) {
      console.error("Lỗi đăng ký: ", error.message);
      Alert.alert("Lỗi", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Đăng ký tài khoản</Title>
          <TextInput
            label="Tên tài khoản"
            value={name}
            onChangeText={setName}
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Tên đầy đủ"
            value={fullName}
            onChangeText={setFullName}
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            mode="outlined"
          />
          <View style={styles.passwordContainer}>
            <TextInput
              label="Mật khẩu"
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              secureTextEntry={!showPassword} // Toggle password visibility
              mode="outlined"
            />
            <Icon
              name={showPassword ? 'eye' : 'eye-off'} // Toggle icon
              size={24}
              color="gray"
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)} // Toggle on press
            />
          </View>
          <View style={styles.passwordContainer}>
            <TextInput
              label="Xác nhận mật khẩu"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.input}
              secureTextEntry={!showConfirmPassword} // Toggle confirm password visibility
              mode="outlined"
            />
            <Icon
              name={showConfirmPassword ? 'eye' : 'eye-off'} // Toggle icon for confirm password
              size={24}
              color="gray"
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)} // Toggle on press
            />
          </View>
          <Button mode="contained" onPress={handleRegister} style={styles.button}>
            Đăng ký
          </Button>
          <Subheading style={styles.loginText}>
            Đã có tài khoản?{' '}
            <Text onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
              Đăng nhập
            </Text>
          </Subheading>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
  card: {
    padding: 16,
    borderRadius: 8,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 16,
    backgroundColor: '#6200ee',
  },
  loginText: {
    marginTop: 12,
    textAlign: 'center',
  },
  loginLink: {
    color: '#007bff',
  },
  passwordContainer: {
    position: 'relative',
  },
  eyeIcon: {
    position: 'absolute',
    right: 10,
    top: 18,
  },
});

export default RegisterScreen;
