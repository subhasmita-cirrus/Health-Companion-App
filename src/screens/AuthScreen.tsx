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
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Radius } from '../constants';
import { useUserStore } from '../stores/userStore';
import { ThemePicker } from '../components/ThemePicker';
import { useAppTheme, useThemedStyles } from '../theme/useAppTheme';
import type { ThemeColors } from '../theme/colors';
import type { AppShadow, AppTypography } from '../theme/useAppTheme';

const AuthScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      <StatusBar barStyle="light-content" backgroundColor={colors.gradientEnd} />
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMiddle, colors.gradientEnd]}
        style={[styles.hero, { paddingTop: insets.top + 28 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Image source={require('../assets/app-icon.png')} style={styles.logoMark} />
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
                <Icon name="account-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full name"
                  placeholderTextColor={colors.textMuted}
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Icon name="email-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="lock-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
                autoComplete="password"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                style={styles.visibilityButton}
              >
                <Icon
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.authButton, isLoading && styles.authButtonDisabled]}
              onPress={handleAuth}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.onPrimary} />
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
                setShowPassword(false);
              }}
              disabled={isLoading}
            >
              <Text style={styles.switchButtonText}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <Text style={styles.switchLink}>{isLogin ? 'Sign up' : 'Sign in'}</Text>
              </Text>
            </TouchableOpacity>

            <Text style={styles.themeLabel}>Appearance</Text>
            <ThemePicker />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

function createStyles(c: ThemeColors, extra: { shadow: AppShadow; typography: AppTypography }) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background,
    },
    flex: { flex: 1 },
    hero: {
      paddingHorizontal: 28,
      paddingBottom: 72,
    },
    logoMark: {
      width: 64,
      height: 64,
      borderRadius: 16,
      marginBottom: 16,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.28)',
    },
    brand: {
      fontSize: 26,
      fontWeight: '700',
      color: '#FFFFFF',
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
      backgroundColor: c.surface,
      borderRadius: Radius.lg,
      padding: 24,
      ...extra.shadow.card,
    },
    title: {
      ...extra.typography.h1,
      fontSize: 24,
      marginBottom: 6,
    },
    subtitle: {
      ...extra.typography.body,
      marginBottom: 22,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.background,
      borderRadius: Radius.md,
      marginBottom: 12,
      paddingHorizontal: 14,
      height: 52,
      borderWidth: 1,
      borderColor: c.border,
    },
    inputIcon: {
      marginRight: 10,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: c.text,
      paddingVertical: 0,
      paddingRight: 8,
    },
    visibilityButton: {
      paddingLeft: 4,
      paddingVertical: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorText: {
      color: c.error,
      fontSize: 13,
      marginTop: 4,
      marginBottom: 4,
    },
    authButton: {
      backgroundColor: c.primary,
      borderRadius: Radius.md,
      paddingVertical: 15,
      marginTop: 12,
    },
    authButtonDisabled: {
      opacity: 0.7,
    },
    authButtonText: {
      color: c.onPrimary,
      fontSize: 16,
      fontWeight: '700',
      textAlign: 'center',
    },
    switchButton: {
      marginTop: 18,
    },
    switchButtonText: {
      color: c.textSecondary,
      fontSize: 14,
      textAlign: 'center',
    },
    switchLink: {
      color: c.primary,
      fontWeight: '700',
    },
    themeLabel: {
      ...extra.typography.small,
      fontWeight: '700',
      marginTop: 20,
      marginBottom: 8,
    },
  });
}

export default AuthScreen;
