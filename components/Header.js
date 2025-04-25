// components/Header.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Thư viện icon (Expo)

const Header = ({ title, onPressMenu }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPressMenu} style={styles.iconContainer}>
        <Ionicons name="menu" size={24} color="white" />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.iconContainer}>
        <Ionicons name="notifications-outline" size={24} color="white" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#4CAF50',
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  iconContainer: {
    padding: 5,
  },
});

export default Header;
