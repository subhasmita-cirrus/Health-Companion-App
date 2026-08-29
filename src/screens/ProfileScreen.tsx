import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  ScrollView,
  StatusBar,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { API_BASE_URL, Radius } from '../constants';
import { useUserStore } from '../stores/userStore';
import { getMe } from '../services/api';
import { ThemePicker } from '../components/ThemePicker';
import { useAppTheme, useThemedStyles } from '../theme/useAppTheme';
import type { ThemeColors } from '../theme/colors';
import type { AppShadow, AppTypography } from '../theme/useAppTheme';

const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors, statusBar } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { user, logout, getFreshIdToken, refreshUser, saveProfile } = useUserStore();
  const [copying, setCopying] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [height, setHeight] = useState(user?.height != null ? String(user.height) : '');
  const [weight, setWeight] = useState(user?.weight != null ? String(user.weight) : '');
  const [fitness, setFitness] = useState(user?.fitnessLevel ?? 'beginner');

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    setName(user?.name ?? '');
    setHeight(user?.height != null ? String(user.height) : '');
    setWeight(user?.weight != null ? String(user.weight) : '');
    setFitness(user?.fitnessLevel ?? 'beginner');
  }, [user?.name, user?.height, user?.weight, user?.fitnessLevel]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveProfile({
        name: name.trim() || user?.name,
        height: (() => {
          const n = Number(height);
          return n >= 50 && n <= 300 ? n : undefined;
        })(),
        weight: (() => {
          const n = Number(weight);
          return n >= 20 && n <= 500 ? n : undefined;
        })(),
        fitnessLevel: fitness as 'beginner' | 'intermediate' | 'advanced',
      });
      Alert.alert('Saved', 'Your profile was updated.');
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setSaving(false);
    }
  };

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

  const initial = (user?.name || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <View style={styles.root}>
      <StatusBar barStyle={statusBar} backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.kicker}>Account</Text>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.name}>{user?.name || 'User'}</Text>
          <Text style={styles.email}>{user?.email || '—'}</Text>
        </View>

        <View style={styles.listCard}>
          <Row icon="account-outline" label="Display name" value={user?.name || '—'} />
          <View style={styles.divider} />
          <Row icon="email-outline" label="Email" value={user?.email || '—'} />
        </View>

        <Text style={styles.section}>Appearance</Text>
        <ThemePicker />

        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => navigation.getParent()?.navigate('Notes' as never)}
        >
          <Icon name="notebook-outline" size={20} color={colors.primary} />
          <Text style={styles.settingsBtnText}>Study notes & reminders</Text>
          <Icon name="chevron-right" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => navigation.getParent()?.navigate('Settings' as never)}
        >
          <Icon name="cog-outline" size={20} color={colors.primary} />
          <Text style={styles.settingsBtnText}>Goals & reminders</Text>
          <Icon name="chevron-right" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <Text style={styles.section}>Edit profile</Text>
        <View style={styles.listCard}>
          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.fieldLabel}>Height (cm)</Text>
          <TextInput
            style={styles.input}
            value={height}
            onChangeText={setHeight}
            keyboardType="numeric"
            placeholder="170"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.fieldLabel}>Weight (kg)</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
            placeholder="65"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.fieldLabel}>Fitness level</Text>
          <View style={styles.fitRow}>
            {(['beginner', 'intermediate', 'advanced'] as const).map((l) => (
              <TouchableOpacity
                key={l}
                style={[styles.fitChip, fitness === l && styles.fitChipOn]}
                onPress={() => setFitness(l)}
              >
                <Text style={[styles.fitText, fitness === l && styles.fitTextOn]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save profile'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={() => logout()} activeOpacity={0.85}>
          <Icon name="logout" size={18} color={colors.error} />
          <Text style={styles.logoutButtonText}>Sign out</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.advancedToggle} onPress={() => setShowAdvanced(!showAdvanced)}>
          <Text style={styles.advancedToggleText}>Developer tools</Text>
          <Icon name={showAdvanced ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {showAdvanced && (
          <View style={styles.listCard}>
            <TouchableOpacity style={styles.devRow} onPress={handleCopyApiToken} disabled={copying}>
              <Text style={styles.devLabel}>{copying ? 'Getting token…' : 'Share API token'}</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.devRow} onPress={handleTestBackend} disabled={testing}>
              <Text style={styles.devLabel}>
                {testing ? 'Testing…' : 'Test backend connection'}
              </Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <Text style={styles.backendHint}>{API_BASE_URL}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.row}>
      <Icon name={icon} size={20} color={colors.primary} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

function createStyles(c: ThemeColors, extra: { shadow: AppShadow; typography: AppTypography }) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { paddingHorizontal: 20, paddingBottom: 40 },
    kicker: {
      ...extra.typography.small,
      color: c.primary,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 4,
    },
    title: { ...extra.typography.h1, marginBottom: 20 },
    heroCard: {
      backgroundColor: c.surface,
      borderRadius: Radius.lg,
      paddingVertical: 28,
      alignItems: 'center',
      marginBottom: 16,
      ...extra.shadow.card,
    },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    avatarText: { fontSize: 28, fontWeight: '700', color: c.primaryDark },
    name: { ...extra.typography.h2 },
    email: { ...extra.typography.body, marginTop: 4 },
    section: { ...extra.typography.h3, marginBottom: 10 },
    settingsBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: Radius.md,
      padding: 16,
      marginBottom: 20,
      gap: 10,
      ...extra.shadow.card,
    },
    settingsBtnText: { flex: 1, fontSize: 15, fontWeight: '700', color: c.text },
    fieldLabel: { ...extra.typography.small, marginTop: 12, marginBottom: 6, fontWeight: '600' },
    input: {
      backgroundColor: c.background,
      borderRadius: Radius.sm,
      paddingHorizontal: 12,
      height: 44,
      color: c.text,
      borderWidth: 1,
      borderColor: c.border,
    },
    fitRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    fitChip: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: Radius.full,
      backgroundColor: c.background,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    fitChipOn: { backgroundColor: c.primary, borderColor: c.primary },
    fitText: { fontSize: 11, fontWeight: '700', color: c.textSecondary, textTransform: 'capitalize' },
    fitTextOn: { color: c.onPrimary },
    saveBtn: {
      backgroundColor: c.primary,
      borderRadius: Radius.md,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 12,
      marginBottom: 8,
    },
    saveText: { color: c.onPrimary, fontWeight: '700' },
    listCard: {
      backgroundColor: c.surface,
      borderRadius: Radius.md,
      paddingHorizontal: 16,
      marginBottom: 16,
      ...extra.shadow.card,
    },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
    rowLabel: { ...extra.typography.small, marginBottom: 2 },
    rowValue: { fontSize: 15, fontWeight: '600', color: c.text },
    divider: { height: 1, backgroundColor: c.border },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: c.surface,
      borderRadius: Radius.md,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: c.errorBorder,
      marginBottom: 20,
    },
    logoutButtonText: { color: c.error, fontSize: 16, fontWeight: '700' },
    advancedToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
      marginBottom: 8,
    },
    advancedToggleText: { ...extra.typography.small, fontWeight: '700', color: c.textSecondary },
    devRow: { paddingVertical: 14 },
    devLabel: { fontSize: 15, color: c.text, fontWeight: '600' },
    backendHint: {
      ...extra.typography.small,
      paddingVertical: 12,
    },
  });
}

export default ProfileScreen;
