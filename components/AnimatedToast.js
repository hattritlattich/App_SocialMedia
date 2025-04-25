// components/AnimatedToast.js
import React, { useState, useEffect } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

const AnimatedToast = ({ message, isVisible }) => {
  const [slideAnim] = useState(new Animated.Value(-100)); // Start off-screen

  useEffect(() => {
    if (isVisible) {
      // Slide down the toast
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Slide up the toast
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, slideAnim]);

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.toast}>
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  toast: {
    backgroundColor: '#8A2BE2',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    marginHorizontal: 20,
  },
  toastText: {
    color: 'white',
    fontSize: 16,
  },
});

export default AnimatedToast;
