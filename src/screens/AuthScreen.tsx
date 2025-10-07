import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Typography } from '../constants';
import { useUserStore } from '../stores/userStore';

const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useUserStore();

  const handleAuth = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Mock authentication for now
    const mockUser = {
      uid: 'user1',
      email: email,
      displayName: email.split('@')[0],
      photoURL: null,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    login(mockUser);
  };

  return (
    <LinearGradient
      colors={[Colors.gradientStart, Colors.gradientMiddle, Colors.gradientEnd]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.formContainer}>
        <Icon name="heart-pulse" size={80} color={Colors.white} style={styles.logo} />
        
        <Text style={styles.title}>
          {isLogin ? 'Welcome Back!' : 'Create Account'}
        </Text>
        
        <Text style={styles.subtitle}>
          {isLogin ? 'Sign in to continue your health journey' : 'Start your health journey today'}
        </Text>

        <View style={styles.inputContainer}>
          <Icon name="email" size={20} color={Colors.gray} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.gray}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Icon name="lock" size={20} color={Colors.gray} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={Colors.gray}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.authButton} onPress={handleAuth}>
          <Text style={styles.authButtonText}>
            {isLogin ? 'Sign In' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text style={styles.switchButtonText}>
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    width: '90%',
    alignItems: 'center',
  },
  logo: {
    marginBottom: 20,
  },
  title: {
    ...Typography.h1,
    color: Colors.white,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.white,
    marginBottom: 40,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 25,
    marginBottom: 15,
    paddingHorizontal: 20,
    width: '100%',
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.black,
  },
  authButton: {
    backgroundColor: Colors.accent,
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 50,
    marginTop: 20,
    marginBottom: 20,
    width: '100%',
  },
  authButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  switchButton: {
    marginTop: 10,
  },
  switchButtonText: {
    color: Colors.white,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default AuthScreen;



