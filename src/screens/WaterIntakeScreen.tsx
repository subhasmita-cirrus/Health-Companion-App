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
import { Colors, Typography, AppConstants, Radius, Shadow } from '../constants';
import { useActivityStore } from '../stores/activityStore';
import { speak } from '../services/ttsService';
import { ProgressRing } from '../components/ProgressRing';

const QUICK_AMOUNTS = [100, 200, 250, 500];

const WaterIntakeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { todayActivity, fetchTodayActivity, updateWaterIntake, isLoading } = useActivityStore();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!todayActivity) fetchTodayActivity();
  }, [todayActivity, fetchTodayActivity]);

  const intake = todayActivity?.waterIntake ?? 0;
  const goal = AppConstants.WATER_INTAKE_GOAL_ML;
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
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.kicker}>Hydration</Text>
        <Text style={styles.title}>Water intake</Text>
        <Text style={styles.subtitle}>Log glasses toward your daily goal</Text>

        <View style={styles.card}>
          <ProgressRing progress={progress} color={Colors.water} size={150} stroke={12}>
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
          <Icon name="volume-high" size={20} color={Colors.primary} />
          <Text style={styles.speakText}>Speak status</Text>
        </TouchableOpacity>

        {(busy || isLoading) && (
          <ActivityIndicator style={{ marginTop: 16 }} color={Colors.primary} />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  kicker: {
    ...Typography.small,
    color: Colors.water,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  title: { ...Typography.h1, marginBottom: 6 },
  subtitle: { ...Typography.body, marginBottom: 22 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    ...Shadow.card,
  },
  amount: { fontSize: 28, fontWeight: '700', color: Colors.black, letterSpacing: -0.5 },
  unit: { ...Typography.small, marginTop: 2 },
  goal: { ...Typography.body, marginTop: 14, color: Colors.darkGray },
  percent: { ...Typography.small, marginTop: 4, color: Colors.water, fontWeight: '600' },
  section: { ...Typography.h3, marginBottom: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radius.full,
  },
  chipText: { color: Colors.black, fontWeight: '600' },
  speakBtn: {
    marginTop: 24,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  speakText: { color: Colors.primary, fontSize: 15, fontWeight: '700' },
});

export default WaterIntakeScreen;
