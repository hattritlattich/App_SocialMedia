import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { TextInput, Button, Card, Title, Subheading } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { auth, signInWithEmailAndPassword } from '../db/firebaseConfig'; // Firebase config
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Import eye icon

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
  const navigation = useNavigation();

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = () => {
    if (!isValidEmail(email)) {
      setErrorMessage('Email không hợp lệ. Vui lòng kiểm tra lại.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setIsLoading(true);

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log("Đăng nhập thành công:", userCredential.user);
        setErrorMessage('');
        setIsLoading(false);
        navigation.replace('AppNavigator');
      })
      .catch((error) => {
        setIsLoading(false);
        const errorCode = error.code;
        if (errorCode === 'auth/user-not-found') {
          setErrorMessage('Người dùng không tồn tại. Vui lòng đăng ký.');
        } else if (errorCode === 'auth/wrong-password') {
          setErrorMessage('Mật khẩu không đúng. Vui lòng thử lại.');
        } else if (errorCode === 'auth/invalid-email') {
          setErrorMessage('Email không hợp lệ.');
        } else {
          setErrorMessage('Đã xảy ra lỗi. Vui lòng thử lại sau.');
        }
      });
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Đăng nhập</Title>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            mode="outlined"
          />
          <View style={styles.passwordContainer}>
            <TextInput
              label="Mật khẩu"
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              secureTextEntry={!showPassword} // Toggle visibility based on state
              mode="outlined"
            />
            <Icon
              name={showPassword ? 'eye' : 'eye-off'} // Toggle icon based on password visibility
              size={24}
              color="gray"
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)} // Toggle password visibility on icon press
            />
          </View>
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          <Button 
            mode="contained" 
            onPress={handleLogin} 
            style={styles.button}
            disabled={isLoading}
          >
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
          <Subheading style={styles.registerText}>
            Chưa có tài khoản?{' '}
            <Text onPress={handleRegister} style={styles.registerLink}>
              Đăng ký
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
    backgroundColor: '#f9f9f9',
  },
  card: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 4,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 22,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 12,
  },
  passwordContainer: {
    position: 'relative',
  },
  eyeIcon: {
    position: 'absolute',
    right: 10,
    top: 18,
  },
  button: {
    marginTop: 16,
    backgroundColor: '#6200ee',
  },
  registerText: {
    marginTop: 12,
    textAlign: 'center',
  },
  registerLink: {
    color: '#007bff',
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 12,
  },
});

export default LoginScreen;
