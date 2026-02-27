import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share } from 'react-native';
import { Colors, Typography, API_BASE_URL } from '../constants';
import { useUserStore } from '../stores/userStore';
import { getMe } from '../services/api';

const ProfileScreen: React.FC = () => {
  const { user, logout, getFreshIdToken, refreshUser } = useUserStore();
  const [copying, setCopying] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const handleTestBackend = async () => {
    setTesting(true);
    try {
      const token = await getFreshIdToken();
      if (!token) {
        Alert.alert('Test backend', 'Not signed in.');
        return;
      }
      await getMe(token);
      Alert.alert('Test backend', 'Connected. Backend is reachable and your user is synced.');
      refreshUser();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert(
        'Test backend',
        `Failed: ${msg}\n\nCheck: phone and PC on same WiFi, backend running (npm run start:dev), and firewall allows port 3000.`,
      );
    } finally {
      setTesting(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleCopyApiToken = async () => {
    setCopying(true);
    try {
      const token = await getFreshIdToken();
      if (!token) {
        Alert.alert('Not signed in', 'Sign in first to copy your API token.');
        return;
      }
      await Share.share({
        message: token,
        title: 'API token for Swagger',
      });
      Alert.alert(
        'Token shared',
        'Paste the token in Swagger: click Authorize, then paste in the Bearer field. Token is valid about 1 hour.',
      );
    } catch {
      Alert.alert('Error', 'Could not get token.');
    } finally {
      setCopying(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>Welcome, {user?.name || 'User'}</Text>

      <TouchableOpacity
        style={[styles.copyTokenButton, copying && styles.copyTokenButtonDisabled]}
        onPress={handleCopyApiToken}
        disabled={copying}
      >
        <Text style={styles.copyTokenButtonText}>
          {copying ? 'Getting token…' : 'Share API token (for Swagger)'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.testBackendButton, testing && styles.copyTokenButtonDisabled]}
        onPress={handleTestBackend}
        disabled={testing}
      >
        <Text style={styles.testBackendButtonText}>
          {testing ? 'Testing…' : 'Test backend connection'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.backendHint}>Backend: {API_BASE_URL}</Text>
      <Text style={styles.backendTip}>If sync fails: same WiFi as PC, backend running, firewall allows port 3000.</Text>
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
    marginBottom: 20,
  },
  copyTokenButton: {
    backgroundColor: Colors.info,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginBottom: 16,
  },
  copyTokenButtonDisabled: {
    opacity: 0.6,
  },
  copyTokenButtonText: {
    color: Colors.white,
    fontSize: 14,
  },
  testBackendButton: {
    backgroundColor: Colors.darkGray,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 16,
  },
  testBackendButtonText: {
    color: Colors.white,
    fontSize: 14,
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
    fontWeight: '700',
  },
  backendHint: {
    ...Typography.small,
    marginTop: 24,
    textAlign: 'center',
    color: Colors.darkGray,
  },
  backendTip: {
    ...Typography.small,
    marginTop: 4,
    textAlign: 'center',
    color: Colors.gray,
    paddingHorizontal: 20,
  },
});

export default ProfileScreen;



