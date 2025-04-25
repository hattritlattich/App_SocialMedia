import React, { useState } from 'react';
import { View, TextInput, FlatList, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../db/firebaseConfig';

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const navigation = useNavigation(); // Sử dụng hook để điều hướng

  const searchUsers = async (queryText) => {
    try {
      if (!queryText) {
        setResults([]);
        return;
      }

      const usersCollection = collection(db, 'users');
      const q = query(usersCollection, where('username', '>=', queryText), where('username', '<=', queryText + '\uf8ff'));
      const snapshot = await getDocs(q);

      const users = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setResults(users);
    } catch (error) {
      console.error('Lỗi khi tìm kiếm người dùng:', error);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    searchUsers(text);
  };

  const handleUserPress = (user) => {
    // Điều hướng đến UserProfileScreen và truyền thông tin người dùng
    navigation.navigate('UserProfileScreen', { user });
    // Xóa nội dung tìm kiếm và kết quả
    setSearchQuery('');
    setResults([]);
  };
  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.item} onPress={() => handleUserPress(item)}>
      <Image
        source={{ uri: item.profilePicture || 'https://via.placeholder.com/50' }}
        style={styles.avatar}
      />
      <View style={styles.info}>
        <Text style={styles.name}>{item.fullName || 'Người dùng'}</Text>
        <Text style={styles.username}>@{item.username}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Tìm kiếm người dùng..."
        value={searchQuery}
        onChangeText={handleSearch}
      />
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          searchQuery ? (
            <Text style={styles.emptyText}>Không tìm thấy người dùng nào.</Text>
          ) : (
            <Text style={styles.emptyText}>Nhập tên người dùng để tìm kiếm.</Text>
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  username: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#aaa',
    fontSize: 16,
  },
});

export default SearchScreen;
