import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Radius } from '../constants';
import { useActivityStore } from '../stores/activityStore';
import { useSettingsStore } from '../stores/settingsStore';
import { speak } from '../services/ttsService';
import { ProgressRing } from '../components/ProgressRing';
import { useAppTheme, useThemedStyles } from '../theme/useAppTheme';
import type { ThemeColors } from '../theme/colors';
import type { AppShadow, AppTypography } from '../theme/useAppTheme';

const QUICK_AMOUNTS = [100, 200, 250, 500];

const WaterIntakeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors, statusBar } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { todayActivity, fetchTodayActivity, updateWaterIntake, isLoading } = useActivityStore();
  const waterGoal = useSettingsStore((s) => s.settings.waterGoal);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!todayActivity) fetchTodayActivity();
  }, [todayActivity, fetchTodayActivity]);

  const intake = todayActivity?.waterIntake ?? 0;
  const goal = waterGoal;
  const progress = Math.min(1, intake / goal);

  const addWater = async (ml: number) => {
    setBusy(true);
    try {
      if (!useActivityStore.getState().todayActivity) {
        await fetchTodayActivity();
      }
      updateWaterIntake(ml);
      await speak(`Added ${ml} milliliters. Total ${intake + ml} milliliters.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle={statusBar} backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.kicker}>Hydration</Text>
        <Text style={styles.title}>Water intake</Text>
        <Text style={styles.subtitle}>Log glasses toward your daily goal</Text>

        <View style={styles.card}>
          <ProgressRing progress={progress} color={colors.water} size={150} stroke={12}>
            <Text style={styles.amount}>{intake}</Text>
            <Text style={styles.unit}>ml</Text>
          </ProgressRing>
          <Text style={styles.goal}>Goal {goal.toLocaleString()} ml</Text>
          <Text style={styles.percent}>{Math.round(progress * 100)}% complete</Text>
        </View>

        <Text style={styles.section}>Quick add</Text>
        <View style={styles.row}>
          {QUICK_AMOUNTS.map((ml) => (
            <TouchableOpacity
              key={ml}
              style={styles.chip}
              onPress={() => addWater(ml)}
              disabled={busy || isLoading}
              activeOpacity={0.85}
            >
              <Text style={styles.chipText}>+{ml} ml</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.speakBtn}
          onPress={() =>
            speak(`You have drunk ${intake} milliliters of water. Your goal is ${goal} milliliters.`)
          }
          activeOpacity={0.85}
        >
          <Icon name="volume-high" size={20} color={colors.primary} />
          <Text style={styles.speakText}>Speak status</Text>
        </TouchableOpacity>

        {(busy || isLoading) && (
          <ActivityIndicator style={{ marginTop: 16 }} color={colors.primary} />
        )}
      </ScrollView>
    </View>
  );
};

function createStyles(c: ThemeColors, extra: { shadow: AppShadow; typography: AppTypography }) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { paddingHorizontal: 20, paddingBottom: 40 },
    kicker: {
      ...extra.typography.small,
      color: c.water,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 4,
    },
    title: { ...extra.typography.h1, marginBottom: 6 },
    subtitle: { ...extra.typography.body, marginBottom: 22 },
    card: {
      backgroundColor: c.surface,
      borderRadius: Radius.lg,
      padding: 24,
      alignItems: 'center',
      marginBottom: 24,
      ...extra.shadow.card,
    },
    amount: { fontSize: 28, fontWeight: '700', color: c.text, letterSpacing: -0.5 },
    unit: { ...extra.typography.small, marginTop: 2 },
    goal: { ...extra.typography.body, marginTop: 14, color: c.textSecondary },
    percent: { ...extra.typography.small, marginTop: 4, color: c.water, fontWeight: '600' },
    section: { ...extra.typography.h3, marginBottom: 12 },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chip: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: Radius.full,
    },
    chipText: { color: c.text, fontWeight: '600' },
    speakBtn: {
      marginTop: 24,
      backgroundColor: c.surface,
      borderRadius: Radius.md,
      paddingVertical: 14,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
    speakText: { color: c.primary, fontSize: 15, fontWeight: '700' },
  });
}

export default WaterIntakeScreen;
