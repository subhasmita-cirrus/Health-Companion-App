import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Typography, Radius, Shadow } from '../constants';
import { useActivityStore, type PeriodFilter } from '../stores/activityStore';
import { usePedometerStore } from '../stores/pedometerStore';
import { ProgressRing } from '../components/ProgressRing';

const PERIODS: { key: PeriodFilter; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'weekly', label: 'Week' },
  { key: 'monthly', label: 'Month' },
  { key: 'yearly', label: 'Year' },
];

const ActivityScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    todayActivity,
    isWalkTracking,
    isUsingDeviceSensor,
    error,
    startWalkTracking,
    stopWalkTracking,
    getStatsForPeriod,
    fetchTodayActivity,
  } = useActivityStore();
  const { stepCount, dailyGoal, distance, initializeStepsForTheDay, setSteps, loadPersisted } =
    usePedometerStore();

  const [period, setPeriod] = useState<PeriodFilter>('today');
  const stats = getStatsForPeriod(period);
  const liveSteps = isUsingDeviceSensor ? stepCount : todayActivity?.steps ?? 0;
  const progress = dailyGoal > 0 ? liveSteps / dailyGoal : 0;

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
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.kicker}>Movement</Text>
        <Text style={styles.title}>Activity</Text>
        <Text style={styles.subtitle}>Track walks and review steps by period</Text>

        <View style={styles.walkCard}>
          <ProgressRing progress={progress} color={Colors.primary} size={148} stroke={12}>
            <Text style={styles.liveSteps}>{liveSteps.toLocaleString()}</Text>
            <Text style={styles.liveStepsLabel}>steps</Text>
          </ProgressRing>
          <Text style={styles.goalCaption}>
            Goal {dailyGoal.toLocaleString()}
            {isWalkTracking ? ' · live' : ''}
          </Text>
          {distance ? <Text style={styles.distanceText}>{distance}</Text> : null}
          {isWalkTracking && (
            <Text style={styles.sensorHint}>Counting only while you walk</Text>
          )}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.startStopButton, isWalkTracking && styles.stopButton]}
            onPress={handleStartStop}
            activeOpacity={0.85}
          >
            <Icon name={isWalkTracking ? 'stop' : 'walk'} size={22} color={Colors.white} />
            <Text style={styles.startStopButtonText}>
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
              <Icon name="walk" size={22} color={Colors.primary} />
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
  title: { ...Typography.h1, marginBottom: 6 },
  subtitle: { ...Typography.body, marginBottom: 22 },
  walkCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    ...Shadow.card,
  },
  liveSteps: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.black,
    letterSpacing: -0.5,
  },
  liveStepsLabel: { ...Typography.small, marginTop: 2 },
  goalCaption: { ...Typography.small, marginTop: 12 },
  distanceText: { ...Typography.small, marginTop: 2, color: Colors.darkGray },
  sensorHint: {
    ...Typography.small,
    marginTop: 8,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  errorText: {
    ...Typography.small,
    marginTop: 8,
    color: Colors.error,
    textAlign: 'center',
  },
  startStopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: Radius.md,
    marginTop: 20,
    gap: 8,
    alignSelf: 'stretch',
  },
  stopButton: { backgroundColor: Colors.error },
  startStopButtonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  trackingBadge: {
    marginTop: 14,
    backgroundColor: Colors.primarySoft,
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
    backgroundColor: Colors.primary,
  },
  trackingBadgeText: { color: Colors.primaryDark, fontSize: 12, fontWeight: '700' },
  sectionTitle: { ...Typography.h3, marginBottom: 12 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: { fontSize: 13, fontWeight: '600', color: Colors.darkGray },
  filterChipTextActive: { color: Colors.white },
  statsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 20,
    ...Shadow.card,
  },
  statsCardTitle: { ...Typography.small, marginBottom: 14, fontWeight: '600' },
  stepsOnlyRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  periodIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsOnlyValue: { ...Typography.h1, fontSize: 28 },
  stepsOnlyLabel: { ...Typography.small, marginTop: 2 },
});

export default ActivityScreen;
