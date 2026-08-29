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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Typography, API_BASE_URL, Radius, Shadow } from '../constants';
import { useUserStore } from '../stores/userStore';
import { getMe } from '../services/api';

const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, logout, getFreshIdToken, refreshUser } = useUserStore();
  const [copying, setCopying] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

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
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
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

        <TouchableOpacity style={styles.logoutButton} onPress={() => logout()} activeOpacity={0.85}>
          <Icon name="logout" size={18} color={Colors.error} />
          <Text style={styles.logoutButtonText}>Sign out</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.advancedToggle} onPress={() => setShowAdvanced(!showAdvanced)}>
          <Text style={styles.advancedToggleText}>Developer tools</Text>
          <Icon name={showAdvanced ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.gray} />
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
  return (
    <View style={styles.row}>
      <Icon name={icon} size={20} color={Colors.primary} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  kicker: {
    ...Typography.small,
    color: Colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  title: { ...Typography.h1, marginBottom: 20 },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: 28,
    alignItems: 'center',
    marginBottom: 16,
    ...Shadow.card,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: Colors.primaryDark },
  name: { ...Typography.h2 },
  email: { ...Typography.body, marginTop: 4 },
  listCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    marginBottom: 16,
    ...Shadow.card,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  rowLabel: { ...Typography.small, marginBottom: 2 },
  rowValue: { fontSize: 15, fontWeight: '600', color: Colors.black },
  divider: { height: 1, backgroundColor: Colors.lightGray },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 20,
  },
  logoutButtonText: { color: Colors.error, fontSize: 16, fontWeight: '700' },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 8,
  },
  advancedToggleText: { ...Typography.small, fontWeight: '700', color: Colors.darkGray },
  devRow: { paddingVertical: 14 },
  devLabel: { fontSize: 15, color: Colors.black, fontWeight: '600' },
  backendHint: {
    ...Typography.small,
    paddingVertical: 12,
  },
});

export default ProfileScreen;
