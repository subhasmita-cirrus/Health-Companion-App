import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Radius, Shadow } from '../constants';
import { useUserStore } from '../stores/userStore';

const AuthScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const { loginWithFirebase, registerWithFirebase, error, setError, isLoading } = useUserStore();

  const handleAuth = async () => {
    setError(null);
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in email and password');
      return;
    }
    if (!isLogin && !displayName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    try {
      if (isLogin) {
        await loginWithFirebase(email, password);
      } else {
        await registerWithFirebase(email, password, displayName.trim());
      }
    } catch {
      // Error is already shown under the form via store.error
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.gradientEnd} />
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientMiddle, Colors.gradientEnd]}
        style={[styles.hero, { paddingTop: insets.top + 28 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.logoMark}>
          <Icon name="heart-pulse" size={36} color={Colors.white} />
        </View>
        <Text style={styles.brand}>HealthCompanion</Text>
        <Text style={styles.heroCopy}>Clinical-grade tracking for daily wellness.</Text>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.formWrap, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.title}>{isLogin ? 'Welcome back' : 'Create account'}</Text>
            <Text style={styles.subtitle}>
              {isLogin
                ? 'Sign in to continue your health journey'
                : 'Start tracking steps, hydration, and tips'}
            </Text>

            {!isLogin && (
              <View style={styles.inputContainer}>
                <Icon name="account-outline" size={20} color={Colors.darkGray} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full name"
                  placeholderTextColor={Colors.gray}
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Icon name="email-outline" size={20} color={Colors.darkGray} style={styles.inputIcon} />
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
              <Icon name="lock-outline" size={20} color={Colors.darkGray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={Colors.gray}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.authButton, isLoading && styles.authButtonDisabled]}
              onPress={handleAuth}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.authButtonText}>{isLogin ? 'Sign in' : 'Create account'}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => {
                setIsLogin(!isLogin);
                setError(null);
                setEmail('');
                setPassword('');
                setDisplayName('');
              }}
              disabled={isLoading}
            >
              <Text style={styles.switchButtonText}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <Text style={styles.switchLink}>{isLogin ? 'Sign up' : 'Sign in'}</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: { flex: 1 },
  hero: {
    paddingHorizontal: 28,
    paddingBottom: 72,
  },
  logoMark: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  brand: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: -0.4,
  },
  heroCopy: {
    marginTop: 8,
    fontSize: 15,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 22,
    maxWidth: 280,
  },
  formWrap: {
    paddingHorizontal: 20,
    marginTop: -48,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 24,
    ...Shadow.card,
  },
  title: {
    ...Typography.h1,
    fontSize: 24,
    marginBottom: 6,
  },
  subtitle: {
    ...Typography.body,
    marginBottom: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    marginBottom: 12,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.black,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 4,
  },
  authButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 15,
    marginTop: 12,
  },
  authButtonDisabled: {
    opacity: 0.7,
  },
  authButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  switchButton: {
    marginTop: 18,
  },
  switchButtonText: {
    color: Colors.darkGray,
    fontSize: 14,
    textAlign: 'center',
  },
  switchLink: {
    color: Colors.primary,
    fontWeight: '700',
  },
});

export default AuthScreen;
