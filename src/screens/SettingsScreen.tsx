import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Typography, Radius, Shadow } from '../constants';
import { useSettingsStore } from '../stores/settingsStore';
import { useNotificationStore } from '../stores/notificationStore';
import notifee from '@notifee/react-native';
import { AppConstants } from '../constants';

const STEP_PRESETS = [5000, 8000, 10000, 12000];
const WATER_PRESETS = [1500, 2000, 2500, 3000];
const INTERVAL_PRESETS = [
  { min: 30, label: '30 min' },
  { min: 60, label: '1 hr' },
  { min: 120, label: '2 hr' },
  { min: 180, label: '3 hr' },
];

const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { settings, updateSettings } = useSettingsStore();
  const { scheduleNotification } = useNotificationStore();
  const [testing, setTesting] = useState(false);

  const sendTest = async () => {
    setTesting(true);
    try {
      await notifee.createChannel({
        id: AppConstants.NOTIFICATION_CHANNEL_ID,
        name: AppConstants.NOTIFICATION_CHANNEL_NAME,
      });
      await notifee.displayNotification({
        title: 'Health Companion',
        body: 'Reminders are working. Stay hydrated and keep moving.',
        android: {
          channelId: AppConstants.NOTIFICATION_CHANNEL_ID,
          pressAction: { id: 'default' },
        },
      });
      await scheduleNotification({
        type: 'general',
        title: 'Test reminder',
        message: 'This follow-up was scheduled from Settings.',
        delayMinutes: 1,
      });
      Alert.alert('Reminder sent', 'You should see a notification now, plus another in about 1 minute.');
    } catch (e) {
      Alert.alert('Could not send', e instanceof Error ? e.message : 'Check notification permission.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={28} color={Colors.black} />
          <Text style={styles.backText}>Profile</Text>
        </TouchableOpacity>
        <Text style={styles.kicker}>Preferences</Text>
        <Text style={styles.title}>Goals & reminders</Text>

        <Text style={styles.section}>Daily step goal</Text>
        <View style={styles.row}>
          {STEP_PRESETS.map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.chip, settings.stepGoal === n && styles.chipOn]}
              onPress={() => updateSettings({ stepGoal: n })}
            >
              <Text style={[styles.chipText, settings.stepGoal === n && styles.chipTextOn]}>
                {(n / 1000).toFixed(0)}k
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.section}>Water goal</Text>
        <View style={styles.row}>
          {WATER_PRESETS.map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.chip, settings.waterGoal === n && styles.chipOn]}
              onPress={() => updateSettings({ waterGoal: n })}
            >
              <Text style={[styles.chipText, settings.waterGoal === n && styles.chipTextOn]}>{n} ml</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.section}>Hydration reminder</Text>
        <View style={styles.row}>
          {INTERVAL_PRESETS.map((p) => (
            <TouchableOpacity
              key={p.min}
              style={[styles.chip, settings.hydrationReminderInterval === p.min && styles.chipOn]}
              onPress={() => updateSettings({ hydrationReminderInterval: p.min })}
            >
              <Text
                style={[
                  styles.chipText,
                  settings.hydrationReminderInterval === p.min && styles.chipTextOn,
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <Toggle
            label="Push reminders"
            value={settings.notificationsEnabled}
            onValueChange={(v) => updateSettings({ notificationsEnabled: v })}
          />
          <View style={styles.divider} />
          <Toggle
            label="Speak health tips"
            value={settings.healthTipVoiceEnabled}
            onValueChange={(v) => updateSettings({ healthTipVoiceEnabled: v })}
          />
        </View>

        <TouchableOpacity style={styles.testBtn} onPress={sendTest} disabled={testing}>
          <Icon name="bell-ring-outline" size={20} color={Colors.white} />
          <Text style={styles.testText}>{testing ? 'Sending…' : 'Send test reminder'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

function Toggle({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.lightGray, true: Colors.primarySoft }}
        thumbColor={value ? Colors.primary : Colors.gray}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginLeft: -8 },
  backText: { fontSize: 16, color: Colors.darkGray, fontWeight: '600' },
  kicker: {
    ...Typography.small,
    color: Colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: { ...Typography.h1, marginBottom: 20, marginTop: 4 },
  section: { ...Typography.h3, marginBottom: 10, marginTop: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  chipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontWeight: '700', color: Colors.darkGray, fontSize: 13 },
  chipTextOn: { color: Colors.white },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    marginBottom: 20,
    ...Shadow.card,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: Colors.black },
  divider: { height: 1, backgroundColor: Colors.lightGray },
  testBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  testText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
});

export default SettingsScreen;
