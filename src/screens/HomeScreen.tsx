import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Animatable from 'react-native-animatable';
import { Radius } from '../constants';
import { useUserStore } from '../stores/userStore';
import { useActivityStore } from '../stores/activityStore';
import { useTipsStore } from '../stores/tipsStore';
import { useSettingsStore } from '../stores/settingsStore';
import { isNoteVisibleToday, useNotesStore } from '../stores/notesStore';
import { speak } from '../services/ttsService';
import { useAppTheme, useThemedStyles } from '../theme/useAppTheme';
import type { ThemeColors } from '../theme/colors';
import type { AppShadow, AppTypography } from '../theme/useAppTheme';
import type { DailyActivity } from '../types';

const MOODS: Array<{
  id: NonNullable<DailyActivity['mood']>;
  emoji: string;
  icon: string;
  title: string;
  hint: string;
  speak: string;
}> = [
  {
    id: 'excellent',
    emoji: '😄',
    icon: 'weather-sunny',
    title: "You're feeling great",
    hint: 'Nice energy today. A short walk will feel easy.',
    speak: 'Feeling excellent. Keep it up with a short walk and water.',
  },
  {
    id: 'good',
    emoji: '🙂',
    icon: 'white-balance-sunny',
    title: "You're feeling good",
    hint: 'Solid mood. Keep sipping water through the day.',
    speak: 'Feeling good today.',
  },
  {
    id: 'okay',
    emoji: '😐',
    icon: 'cloud-outline',
    title: "You're feeling okay",
    hint: 'A stretch or a glass of water can lift this a bit.',
    speak: 'Feeling okay. A short break might help.',
  },
  {
    id: 'poor',
    emoji: '🙁',
    icon: 'weather-cloudy',
    title: "You're feeling low",
    hint: 'Be kind to yourself. Rest and hydrate.',
    speak: 'Feeling low. Take it easy and drink some water.',
  },
  {
    id: 'terrible',
    emoji: '😞',
    icon: 'weather-pouring',
    title: 'Having a hard day',
    hint: 'Slow down. One quiet minute of breathing can help.',
    speak: 'Having a hard day. Be gentle with yourself.',
  },
];

const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { user } = useUserStore();
  const { todayActivity, fetchTodayActivity, updateWaterIntake, updateMood } = useActivityStore();
  const { tips, fetchTips } = useTipsStore();
  const { settings } = useSettingsStore();
  const notes = useNotesStore((s) => s.notes);
  const loadPlanner = useNotesStore((s) => s.loadPlanner);
  const notesLoaded = useNotesStore((s) => s.loaded);

  useEffect(() => {
    if (!todayActivity) fetchTodayActivity();
    if (!tips.length) fetchTips();
    if (!notesLoaded) loadPlanner();
  }, [todayActivity, fetchTodayActivity, tips.length, fetchTips, notesLoaded, loadPlanner]);

  const tipPreview =
    tips[0]?.content ??
    'Stay hydrated. Aim for about 2 litres of water a day to maintain energy.';

  const steps = todayActivity?.steps || 0;
  const water = todayActivity?.waterIntake || 0;
  const calories = todayActivity?.caloriesBurned || 0;
  const stepGoal = settings.stepGoal;
  const waterGoal = settings.waterGoal;

  const firstName = (user?.name || 'there').split(' ')[0];
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const addWaterQuick = () => {
    Alert.alert(
      'Are you drinking this?',
      'Add 200 ml only if you actually drank it.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, I drank it',
          onPress: async () => {
            if (!useActivityStore.getState().todayActivity) await fetchTodayActivity();
            updateWaterIntake(200);
            speak('Added 200 milliliters of water.');
          },
        },
      ]
    );
  };

  const selectedMood = MOODS.find((m) => m.id === todayActivity?.mood);

  const onMood = (id: NonNullable<DailyActivity['mood']>) => {
    updateMood(id);
    const meta = MOODS.find((m) => m.id === id);
    if (meta) speak(meta.speak);
  };

  const visibleNotes = notes.filter((n) => isNoteVisibleToday(n));
  const openNotes = () => navigation.getParent()?.navigate('Notes' as never);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.gradientEnd} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientMiddle, colors.gradientEnd]}
          style={[styles.header, { paddingTop: insets.top + 18 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.dateLabel}>{todayLabel}</Text>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>Good day, {firstName}</Text>
              <Text style={styles.headerSub}>Here’s your wellness snapshot</Text>
            </View>
            <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Profile' as never)}>
              <Text style={styles.avatarText}>{(user?.name || 'U').charAt(0).toUpperCase()}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Today</Text>
          <View style={styles.statsContainer}>
            <StatTile
              icon="walk"
              tint={colors.primarySoft}
              iconColor={colors.steps}
              value={steps.toLocaleString()}
              label="Steps"
              progress={steps / stepGoal}
            />
            <StatTile
              icon="cup-water"
              tint={colors.waterSoft}
              iconColor={colors.water}
              value={`${water}`}
              label="ml water"
              progress={water / waterGoal}
            />
            <StatTile
              icon="fire"
              tint={colors.calorieSoft}
              iconColor={colors.calories}
              value={`${calories}`}
              label="Calories"
              progress={Math.min(1, calories / 500)}
            />
          </View>

          <View style={styles.insight}>
            <Text style={styles.insightText}>
              {Math.round(Math.min(100, (steps / Math.max(1, stepGoal)) * 100))}% of your step goal ·{' '}
              {Math.round(Math.min(100, (water / Math.max(1, waterGoal)) * 100))}% hydrated
            </Text>
          </View>

          <Text style={styles.sectionTitle}>How are you feeling?</Text>
          <Animatable.View
            key={selectedMood?.id ?? 'none'}
            animation="bounceIn"
            duration={480}
            style={styles.moodCard}
          >
            <View style={styles.moodImageWrap}>
              <Icon
                name={(selectedMood?.icon ?? 'emoticon-outline') as never}
                size={36}
                color={colors.primary}
              />
              <Text style={styles.moodImage}>{selectedMood?.emoji ?? '🙂'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.moodCardTitle}>
                {selectedMood ? selectedMood.title : 'Tap a face below'}
              </Text>
              <Text style={styles.moodCardHint}>
                {selectedMood
                  ? selectedMood.hint
                  : 'This saves today’s mood and helps personalize health tips.'}
              </Text>
            </View>
          </Animatable.View>
          <View style={styles.moodRow}>
            {MOODS.map((m) => {
              const on = todayActivity?.mood === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.moodChip, on && styles.moodChipOn]}
                  onPress={() => onMood(m.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.moodText, on && styles.moodTextOn]}>{m.emoji}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>Quick actions</Text>
          <View style={styles.actionsContainer}>
            <ActionTile icon="plus" label="Add water" onPress={addWaterQuick} />
            <ActionTile icon="walk" label="Start walk" onPress={() => navigation.navigate('Activity' as never)} />
            <ActionTile
              icon="notebook-outline"
              label="Study notes"
              onPress={() => navigation.getParent()?.navigate('Notes' as never)}
            />
          </View>

          <TouchableOpacity style={styles.tipCard} onPress={openNotes} activeOpacity={0.9}>
            <View style={styles.tipAccent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.tipKicker}>Study today</Text>
              <Text style={styles.tipTitle}>Notes & reminders</Text>
              <Text style={styles.tipText} numberOfLines={2}>
                {visibleNotes.length
                  ? `${visibleNotes.filter((n) => n.done).length}/${visibleNotes.length} notes done · tap to add more`
                  : 'Log study points (Keep always or Today only) and set reminders.'}
              </Text>
            </View>
            <Icon name="chevron-right" size={22} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tipCard}
            onPress={() => navigation.navigate('Tips' as never)}
            activeOpacity={0.9}
          >
            <View style={styles.tipAccent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.tipKicker}>Today’s insight</Text>
              <Text style={styles.tipTitle}>Health tip</Text>
              <Text style={styles.tipText} numberOfLines={3}>
                {tipPreview}
              </Text>
            </View>
            <Icon name="chevron-right" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

function StatTile({
  icon,
  tint,
  iconColor,
  value,
  label,
  progress,
}: {
  icon: string;
  tint: string;
  iconColor: string;
  value: string;
  label: string;
  progress: number;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: tint }]}>
        <Icon name={icon} size={20} color={iconColor} />
      </View>
      <Text style={styles.statNumber} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.miniTrack}>
        <View style={[styles.miniFill, { width: `${Math.min(100, Math.max(4, progress * 100))}%`, backgroundColor: iconColor }]} />
      </View>
    </View>
  );
}

function ActionTile({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.actionIcon}>
        <Icon name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={styles.actionButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

function createStyles(c: ThemeColors, extra: { shadow: AppShadow; typography: AppTypography }) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    header: {
      paddingHorizontal: 24,
      paddingBottom: 28,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
    },
    dateLabel: {
      color: 'rgba(255,255,255,0.75)',
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.3,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    greeting: {
      fontSize: 26,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: -0.4,
    },
    headerSub: {
      marginTop: 4,
      color: 'rgba(255,255,255,0.8)',
      fontSize: 14,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.28)',
    },
    avatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 18 },
    content: { padding: 20, paddingTop: 22 },
    sectionTitle: { ...extra.typography.h3, marginBottom: 12, color: c.text },
    statsContainer: {
      flexDirection: 'row',
      marginBottom: 14,
      gap: 10,
    },
    insight: {
      backgroundColor: c.primarySoft,
      borderRadius: Radius.md,
      padding: 12,
      marginBottom: 22,
    },
    insightText: { color: c.primaryDark, fontWeight: '600', fontSize: 13, lineHeight: 18 },
    moodCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: c.surface,
      borderRadius: Radius.md,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.border,
      ...extra.shadow.card,
    },
    moodImageWrap: {
      width: 72,
      height: 72,
      borderRadius: 18,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    moodImage: { fontSize: 36, marginTop: 2 },
    moodCardTitle: { ...extra.typography.h3, marginBottom: 4 },
    moodCardHint: { ...extra.typography.small, color: c.textSecondary, lineHeight: 18 },
    moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22 },
    moodChip: {
      width: 56,
      height: 52,
      borderRadius: 14,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.border,
      ...extra.shadow.card,
    },
    moodChipOn: {
      borderWidth: 2,
      borderColor: c.primary,
      backgroundColor: c.primarySoft,
    },
    moodText: { fontSize: 26 },
    moodTextOn: { fontSize: 30 },
    statCard: {
      backgroundColor: c.surface,
      borderRadius: Radius.md,
      padding: 14,
      flex: 1,
      ...extra.shadow.card,
    },
    statIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    statNumber: {
      fontSize: 18,
      fontWeight: '700',
      color: c.text,
    },
    statLabel: {
      ...extra.typography.small,
      marginTop: 2,
      marginBottom: 10,
    },
    miniTrack: {
      height: 4,
      backgroundColor: c.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    miniFill: { height: '100%', borderRadius: 4 },
    actionsContainer: {
      flexDirection: 'row',
      marginBottom: 22,
      gap: 10,
    },
    actionButton: {
      backgroundColor: c.surface,
      borderRadius: Radius.md,
      paddingVertical: 14,
      alignItems: 'center',
      flex: 1,
      ...extra.shadow.card,
    },
    actionIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    actionButtonText: {
      color: c.text,
      fontSize: 12,
      fontWeight: '600',
      textAlign: 'center',
    },
    tipCard: {
      backgroundColor: c.surface,
      borderRadius: Radius.md,
      padding: 18,
      flexDirection: 'row',
      alignItems: 'center',
      overflow: 'hidden',
      marginBottom: 14,
      ...extra.shadow.card,
    },
    tipAccent: {
      width: 4,
      alignSelf: 'stretch',
      backgroundColor: c.accent,
      borderRadius: 4,
      marginRight: 14,
    },
    tipKicker: {
      ...extra.typography.small,
      color: c.primary,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 4,
    },
    tipTitle: { ...extra.typography.h3, marginBottom: 6 },
    tipText: { ...extra.typography.body, lineHeight: 21 },
  });
}

export default HomeScreen;
