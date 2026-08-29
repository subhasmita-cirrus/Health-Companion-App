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
import { Colors, Typography, Radius, Shadow } from '../constants';
import { useTipsStore } from '../stores/tipsStore';
import { speak, stopSpeaking } from '../services/ttsService';

const TipsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { tips, isLoading, error, fetchTips, generatePersonalizedTip, markTipAsRead } =
    useTipsStore();

  useEffect(() => {
    fetchTips();
  }, [fetchTips]);

  const onGenerate = async () => {
    const tip = await generatePersonalizedTip();
    if (tip) await speak(`${tip.title}. ${tip.content}`);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
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
          <Icon name="auto-fix" size={20} color={Colors.white} />
          <Text style={styles.primaryBtnText}>
            {isLoading ? 'Generating…' : 'Get a personalized tip'}
          </Text>
        </TouchableOpacity>

        {isLoading && <ActivityIndicator style={{ marginVertical: 12 }} color={Colors.primary} />}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {tips.map((tip) => (
          <View key={tip.id} style={[styles.card, tip.isRead && styles.cardRead]}>
            <View style={styles.cardHeader}>
              <View style={styles.bulb}>
                <Icon name="lightbulb-on-outline" size={18} color={Colors.warning} />
              </View>
              <Text style={styles.cardTitle}>{tip.title}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.category}>{tip.category.replace('-', ' ')}</Text>
            </View>
            <Text style={styles.cardBody}>{tip.content}</Text>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => speak(`${tip.title}. ${tip.content}`)}
              >
                <Icon name="volume-high" size={18} color={Colors.primary} />
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
  subtitle: { ...Typography.body, marginBottom: 20 },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  primaryBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  error: { color: Colors.error, marginBottom: 12 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 16,
    marginBottom: 12,
    ...Shadow.card,
  },
  cardRead: { opacity: 0.62 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bulb: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { ...Typography.h3, flex: 1 },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  category: {
    ...Typography.small,
    color: Colors.primaryDark,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  cardBody: { ...Typography.body, marginTop: 10, lineHeight: 22 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  secondaryText: { color: Colors.primary, fontWeight: '700' },
  markRead: { color: Colors.darkGray, fontWeight: '600' },
  stopBtn: { marginTop: 4, alignItems: 'center', padding: 12 },
  stopText: { color: Colors.darkGray, fontWeight: '600' },
});

export default TipsScreen;
