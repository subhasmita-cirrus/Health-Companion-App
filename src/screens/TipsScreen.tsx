import React, { useEffect } from 'react';
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
import { useTipsStore } from '../stores/tipsStore';
import { speak, stopSpeaking } from '../services/ttsService';
import { useAppTheme, useThemedStyles } from '../theme/useAppTheme';
import type { ThemeColors } from '../theme/colors';
import type { AppShadow, AppTypography } from '../theme/useAppTheme';

const TipsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors, statusBar } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { tips, isLoading, error, fetchTips, generatePersonalizedTip, markTipAsRead } =
    useTipsStore();

  useEffect(() => {
    fetchTips();
  }, [fetchTips]);

  const onGenerate = async () => {
    const tip = await generatePersonalizedTip();
    if (tip) speak(`${tip.title}. ${tip.content}`);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle={statusBar} backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.kicker}>Guidance</Text>
        <Text style={styles.title}>Health tips</Text>
        <Text style={styles.subtitle}>Personalized recommendations you can listen to</Text>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={onGenerate}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          <Icon name="auto-fix" size={20} color={colors.onPrimary} />
          <Text style={styles.primaryBtnText}>
            {isLoading ? 'Generating…' : 'Get a personalized tip'}
          </Text>
        </TouchableOpacity>

        {isLoading && <ActivityIndicator style={{ marginVertical: 12 }} color={colors.primary} />}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {tips.map((tip) => (
          <View key={tip.id} style={[styles.card, tip.isRead && styles.cardRead]}>
            <View style={styles.cardHeader}>
              <View style={styles.bulb}>
                <Icon name="lightbulb-on-outline" size={18} color={colors.warning} />
              </View>
              <Text style={styles.cardTitle}>{tip.title}</Text>
            </View>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.category}>{tip.category.replace('-', ' ')}</Text>
              </View>
              {tip.id.startsWith('gemini') ? (
                <View style={[styles.badge, styles.aiBadge]}>
                  <Text style={styles.aiBadgeText}>AI</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.cardBody}>{tip.content}</Text>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => speak(`${tip.title}. ${tip.content}`)}
              >
                <Icon name="volume-high" size={18} color={colors.primary} />
                <Text style={styles.secondaryText}>Listen</Text>
              </TouchableOpacity>
              {!tip.isRead && (
                <TouchableOpacity onPress={() => markTipAsRead(tip.id)}>
                  <Text style={styles.markRead}>Mark as read</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.stopBtn} onPress={() => stopSpeaking()}>
          <Text style={styles.stopText}>Stop speaking</Text>
        </TouchableOpacity>
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
    subtitle: { ...extra.typography.body, marginBottom: 20 },
    primaryBtn: {
      backgroundColor: c.primary,
      borderRadius: Radius.md,
      paddingVertical: 14,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
    },
    primaryBtnText: { color: c.onPrimary, fontSize: 16, fontWeight: '700' },
    error: { color: c.error, marginBottom: 12 },
    card: {
      backgroundColor: c.surface,
      borderRadius: Radius.md,
      padding: 16,
      marginBottom: 12,
      ...extra.shadow.card,
    },
    cardRead: { opacity: 0.62 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    bulb: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: c.warningSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTitle: { ...extra.typography.h3, flex: 1 },
    badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
    badge: {
      alignSelf: 'flex-start',
      backgroundColor: c.primarySoft,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: Radius.full,
    },
    aiBadge: { backgroundColor: c.warningSoft },
    aiBadgeText: {
      ...extra.typography.small,
      color: c.warning,
      fontWeight: '700',
    },
    category: {
      ...extra.typography.small,
      color: c.primaryDark,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    cardBody: { ...extra.typography.body, marginTop: 10, lineHeight: 22 },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 14,
    },
    secondaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    secondaryText: { color: c.primary, fontWeight: '700' },
    markRead: { color: c.textSecondary, fontWeight: '600' },
    stopBtn: { marginTop: 4, alignItems: 'center', padding: 12 },
    stopText: { color: c.textSecondary, fontWeight: '600' },
  });
}

export default TipsScreen;
