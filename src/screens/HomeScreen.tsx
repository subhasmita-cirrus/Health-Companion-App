import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Typography, Radius, Shadow, AppConstants } from '../constants';
import { useUserStore } from '../stores/userStore';
import { useActivityStore } from '../stores/activityStore';
import { useTipsStore } from '../stores/tipsStore';
import { speak } from '../services/ttsService';

const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useUserStore();
  const { todayActivity, fetchTodayActivity, updateWaterIntake } = useActivityStore();
  const { tips, fetchTips, generatePersonalizedTip } = useTipsStore();

  useEffect(() => {
    if (!todayActivity) fetchTodayActivity();
    if (!tips.length) fetchTips();
  }, [todayActivity, fetchTodayActivity, tips.length, fetchTips]);

  const tipPreview =
    tips[0]?.content ??
    'Stay hydrated. Aim for about 2 litres of water a day to maintain energy.';

  const steps = todayActivity?.steps || 0;
  const water = todayActivity?.waterIntake || 0;
  const calories = todayActivity?.caloriesBurned || 0;
  const stepGoal = AppConstants.STEP_GOAL;
  const waterGoal = AppConstants.WATER_INTAKE_GOAL_ML;

  const firstName = (user?.name || 'there').split(' ')[0];
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const addWaterQuick = async () => {
    if (!useActivityStore.getState().todayActivity) await fetchTodayActivity();
    updateWaterIntake(200);
    await speak('Added 200 milliliters of water.');
  };

  const onHealthTip = async () => {
    const tip = await generatePersonalizedTip();
    if (tip) {
      await speak(`${tip.title}. ${tip.content}`);
      navigation.navigate('Tips' as never);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.gradientEnd} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientMiddle, Colors.gradientEnd]}
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
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(user?.name || 'U').charAt(0).toUpperCase()}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Today</Text>
          <View style={styles.statsContainer}>
            <StatTile
              icon="walk"
              tint={Colors.primarySoft}
              iconColor={Colors.steps}
              value={steps.toLocaleString()}
              label="Steps"
              progress={steps / stepGoal}
            />
            <StatTile
              icon="cup-water"
              tint="#E0F2FE"
              iconColor={Colors.water}
              value={`${water}`}
              label="ml water"
              progress={water / waterGoal}
            />
            <StatTile
              icon="fire"
              tint="#FFEDD5"
              iconColor={Colors.calories}
              value={`${calories}`}
              label="Calories"
              progress={Math.min(1, calories / 500)}
            />
          </View>

          <Text style={styles.sectionTitle}>Quick actions</Text>
          <View style={styles.actionsContainer}>
            <ActionTile icon="plus" label="Add water" onPress={addWaterQuick} />
            <ActionTile icon="walk" label="Start walk" onPress={() => navigation.navigate('Activity' as never)} />
            <ActionTile icon="lightbulb-on-outline" label="Health tip" onPress={onHealthTip} />
          </View>

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
            <Icon name="chevron-right" size={22} color={Colors.gray} />
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
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.actionIcon}>
        <Icon name={icon} size={20} color={Colors.primary} />
      </View>
      <Text style={styles.actionButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
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
    color: Colors.white,
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
  avatarText: { color: Colors.white, fontWeight: '700', fontSize: 18 },
  content: { padding: 20, paddingTop: 22 },
  sectionTitle: { ...Typography.h3, marginBottom: 12, color: Colors.black },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 26,
    gap: 10,
  },
  statCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 14,
    flex: 1,
    ...Shadow.card,
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
    color: Colors.black,
  },
  statLabel: {
    ...Typography.small,
    marginTop: 2,
    marginBottom: 10,
  },
  miniTrack: {
    height: 4,
    backgroundColor: Colors.lightGray,
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
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    flex: 1,
    ...Shadow.card,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionButtonText: {
    color: Colors.black,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  tipCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    ...Shadow.card,
  },
  tipAccent: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: Colors.accent,
    borderRadius: 4,
    marginRight: 14,
  },
  tipKicker: {
    ...Typography.small,
    color: Colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  tipTitle: { ...Typography.h3, marginBottom: 6 },
  tipText: { ...Typography.body, lineHeight: 21 },
});

export default HomeScreen;
