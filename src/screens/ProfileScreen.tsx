import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography } from '../constants';
import { useUserStore } from '../stores/userStore';

const ProfileScreen: React.FC = () => {
  const { user, logout } = useUserStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>Welcome, {user?.displayName || 'User'}</Text>
      
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  title: {
    ...Typography.h1,
    marginBottom: 10,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: 30,
  },
  logoutButton: {
    backgroundColor: Colors.error,
    borderRadius: 10,
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  logoutButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;



