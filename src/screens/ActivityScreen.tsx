import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Radius } from '../constants';
import { useActivityStore, type PeriodFilter } from '../stores/activityStore';
import { usePedometerStore } from '../stores/pedometerStore';
import { useSettingsStore } from '../stores/settingsStore';
import { ProgressRing } from '../components/ProgressRing';
import { WeeklyChart } from '../components/WeeklyChart';
import { useAppTheme, useThemedStyles } from '../theme/useAppTheme';
import type { ThemeColors } from '../theme/colors';
import type { AppShadow, AppTypography } from '../theme/useAppTheme';

const PERIODS: { key: PeriodFilter; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'weekly', label: 'Week' },
  { key: 'monthly', label: 'Month' },
  { key: 'yearly', label: 'Year' },
];

const ActivityScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors, statusBar } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const {
    todayActivity,
    isWalkTracking,
    error,
    startWalkTracking,
    stopWalkTracking,
    getStatsForPeriod,
    getDailySeries,
    fetchTodayActivity,
  } = useActivityStore();
  const { stepCount, dailyGoal, distance, initializeStepsForTheDay, setSteps, loadPersisted } =
    usePedometerStore();
  const stepGoal = useSettingsStore((s) => s.settings.stepGoal);

  const [period, setPeriod] = useState<PeriodFilter>('today');
  const stats = getStatsForPeriod(period);
  const series = getDailySeries(7);
  const liveSteps = Math.max(stepCount, todayActivity?.steps ?? 0);
  const goal = stepGoal || dailyGoal;
  const progress = goal > 0 ? liveSteps / goal : 0;

  useEffect(() => {
    loadPersisted();
  }, [loadPersisted]);

  useEffect(() => {
    if (!todayActivity) fetchTodayActivity();
  }, [todayActivity, fetchTodayActivity]);

  useEffect(() => {
    initializeStepsForTheDay();
  }, [initializeStepsForTheDay]);

  const handleStartStop = () => {
    if (isWalkTracking) {
      stopWalkTracking();
    } else {
      startWalkTracking((total, dist) => setSteps(total, dist));
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle={statusBar} backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.kicker}>Movement</Text>
        <Text style={styles.title}>Activity</Text>
        <Text style={styles.subtitle}>Track walks and review steps by period</Text>

        <View style={styles.walkCard}>
          <ProgressRing progress={progress} color={colors.primary} size={148} stroke={12}>
            <Text style={styles.liveSteps}>{liveSteps.toLocaleString()}</Text>
            <Text style={styles.liveStepsLabel}>steps</Text>
          </ProgressRing>
          <Text style={styles.goalCaption}>
            Goal {goal.toLocaleString()}
            {isWalkTracking ? ' · live' : ''}
          </Text>
          {distance ? <Text style={styles.distanceText}>{distance}</Text> : null}
          {isWalkTracking && (
            <Text style={styles.sensorHint}>
              Keep the phone on you and walk. The number goes up with each step.
            </Text>
          )}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.startStopButton, isWalkTracking && styles.stopButton]}
            onPress={handleStartStop}
            activeOpacity={0.85}
          >
            <Icon
              name={isWalkTracking ? 'stop' : 'walk'}
              size={22}
              color={isWalkTracking ? '#FFFFFF' : colors.onPrimary}
            />
            <Text style={[styles.startStopButtonText, isWalkTracking && { color: '#FFFFFF' }]}>
              {isWalkTracking ? 'Stop walk' : 'Start walk'}
            </Text>
          </TouchableOpacity>
          {isWalkTracking && (
            <View style={styles.trackingBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.trackingBadgeText}>Tracking</Text>
            </View>
          )}
        </View>

        <WeeklyChart title="Steps · last 7 days" labels={series.labels} values={series.steps} />
        <WeeklyChart
          title="Water (ml) · last 7 days"
          labels={series.labels}
          values={series.water}
          color={colors.water}
        />

        <Text style={styles.sectionTitle}>Period</Text>
        <View style={styles.filterRow}>
          {PERIODS.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.filterChip, period === key && styles.filterChipActive]}
              onPress={() => setPeriod(key)}
            >
              <Text style={[styles.filterChipText, period === key && styles.filterChipTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsCardTitle}>
            {period === 'today' && 'Today'}
            {period === 'weekly' && 'Last 7 days'}
            {period === 'monthly' && 'Last 30 days'}
            {period === 'yearly' && 'Last 12 months'}
          </Text>
          <View style={styles.stepsOnlyRow}>
            <View style={styles.periodIcon}>
              <Icon name="walk" size={22} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.stepsOnlyValue}>{stats.steps.toLocaleString()}</Text>
              <Text style={styles.stepsOnlyLabel}>Total steps</Text>
            </View>
          </View>
        </View>
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
      color: c.primary,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 4,
    },
    title: { ...extra.typography.h1, marginBottom: 6 },
    subtitle: { ...extra.typography.body, marginBottom: 22 },
    walkCard: {
      backgroundColor: c.surface,
      borderRadius: Radius.lg,
      padding: 24,
      alignItems: 'center',
      marginBottom: 24,
      ...extra.shadow.card,
    },
    liveSteps: {
      fontSize: 28,
      fontWeight: '700',
      color: c.text,
      letterSpacing: -0.5,
    },
    liveStepsLabel: { ...extra.typography.small, marginTop: 2 },
    goalCaption: { ...extra.typography.small, marginTop: 12 },
    distanceText: { ...extra.typography.small, marginTop: 2, color: c.textSecondary },
    sensorHint: {
      ...extra.typography.small,
      marginTop: 8,
      fontStyle: 'italic',
      textAlign: 'center',
    },
    errorText: {
      ...extra.typography.small,
      marginTop: 8,
      color: c.error,
      textAlign: 'center',
    },
    startStopButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primary,
      paddingVertical: 14,
      paddingHorizontal: 28,
      borderRadius: Radius.md,
      marginTop: 20,
      gap: 8,
      alignSelf: 'stretch',
    },
    stopButton: { backgroundColor: c.error },
    startStopButtonText: { color: c.onPrimary, fontSize: 16, fontWeight: '700' },
    trackingBadge: {
      marginTop: 14,
      backgroundColor: c.primarySoft,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: Radius.full,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    liveDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: c.primary,
    },
    trackingBadgeText: { color: c.primaryDark, fontSize: 12, fontWeight: '700' },
    sectionTitle: { ...extra.typography.h3, marginBottom: 12 },
    filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    filterChip: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: Radius.full,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
    },
    filterChipActive: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    filterChipText: { fontSize: 13, fontWeight: '600', color: c.textSecondary },
    filterChipTextActive: { color: c.onPrimary },
    statsCard: {
      backgroundColor: c.surface,
      borderRadius: Radius.md,
      padding: 20,
      ...extra.shadow.card,
    },
    statsCardTitle: { ...extra.typography.small, marginBottom: 14, fontWeight: '600' },
    stepsOnlyRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    periodIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepsOnlyValue: { ...extra.typography.h1, fontSize: 28 },
    stepsOnlyLabel: { ...extra.typography.small, marginTop: 2 },
  });
}

export default ActivityScreen;
