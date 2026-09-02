import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Radius } from '../constants';
import { ALL_DAY_HOURS, isNoteVisibleToday, useNotesStore } from '../stores/notesStore';
import { useAppTheme, useThemedStyles } from '../theme/useAppTheme';
import type { ThemeColors } from '../theme/colors';
import type { AppShadow, AppTypography } from '../theme/useAppTheme';

const HOUR_CHIPS = [8, 10, 12, 14, 16, 18, 20, 21];

function labelHour(h: number) {
  const ampm = h >= 12 ? 'pm' : 'am';
  const n = h % 12 === 0 ? 12 : h % 12;
  return `${n}${ampm}`;
}

const NotesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors, statusBar } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const {
    notes,
    reminders,
    loaded,
    loadPlanner,
    addNote,
    toggleNote,
    deleteNote,
    addReminder,
    toggleReminder,
    deleteReminder,
  } = useNotesStore();

  const [noteText, setNoteText] = useState('');
  const [keepAlways, setKeepAlways] = useState(true);
  const [remText, setRemText] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [hour, setHour] = useState(9);

  useEffect(() => {
    if (!loaded) loadPlanner();
  }, [loaded, loadPlanner]);

  const visibleNotes = useMemo(() => notes.filter((n) => isNoteVisibleToday(n)), [notes]);
  const doneCount = visibleNotes.filter((n) => n.done).length;

  const saveNote = async () => {
    if (!noteText.trim()) {
      Alert.alert('Add points', 'Write one point per line, like a notes app.');
      return;
    }
    await addNote(noteText, keepAlways, hour, allDay);
    setNoteText('');
    Alert.alert(
      keepAlways ? 'Saved with reminder' : 'Saved for today',
      keepAlways
        ? allDay
          ? `This stays on the list. You'll get a ping every day at ${ALL_DAY_HOURS.map(labelHour).join(', ')}. Allow notifications if asked.`
          : `This stays on the list. You'll get a reminder every day at ${labelHour(hour)}. Allow notifications if asked.`
        : 'Today only — no daily reminder.',
    );
  };

  const pointCount = noteText.split(/\r?\n/).filter((l) => l.trim()).length;

  const remPointCount = remText.split(/\r?\n/).filter((l) => l.trim()).length;

  const saveReminder = async () => {
    if (!remText.trim()) {
      Alert.alert('Add reminders', 'Write one reminder per line, like a notes app.');
      return;
    }
    const count = remText.split(/\r?\n/).filter((l) => l.trim()).length;
    await addReminder(remText, allDay, hour);
    setRemText('');
    setAllDay(false);
    Alert.alert(
      count > 1 ? `${count} reminders on` : 'Reminder on',
      allDay
        ? `Each one pings every day at ${ALL_DAY_HOURS.map(labelHour).join(', ')}.`
        : `Each one reminds you every day at ${labelHour(hour)}.`,
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle={statusBar} backgroundColor={colors.background} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={28} color={colors.text} />
          <Text style={styles.backText}>Home</Text>
        </TouchableOpacity>
        <Text style={styles.kicker}>Planner</Text>
        <Text style={styles.title}>Study & reminders</Text>
        <Text style={styles.subtitle}>
          Keep always stays on the list and sends a daily reminder. Today only is for this day, with
          no ping.
        </Text>

        <Text style={styles.section}>
          Study points {visibleNotes.length ? `· ${doneCount}/${visibleNotes.length} done` : ''}
        </Text>
        <View style={styles.composer}>
          <View style={styles.padHeader}>
            <Icon name="format-list-bulleted" size={18} color={colors.primary} />
            <Text style={styles.padHeaderText}>Write points (Enter for next line)</Text>
          </View>
          <TextInput
            style={styles.padInput}
            value={noteText}
            onChangeText={setNoteText}
            placeholder={'• Revise DSA arrays\n• NestJS auth chapter\n• 30 min OS notes'}
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
          />
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeChip, keepAlways && styles.modeChipOn]}
              onPress={() => setKeepAlways(true)}
            >
              <Text style={[styles.modeText, keepAlways && styles.modeTextOn]}>Keep always</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeChip, !keepAlways && styles.modeChipOn]}
              onPress={() => setKeepAlways(false)}
            >
              <Text style={[styles.modeText, !keepAlways && styles.modeTextOn]}>Today only</Text>
            </TouchableOpacity>
          </View>
          {keepAlways ? (
            <>
              <View style={styles.modeRow}>
                <TouchableOpacity
                  style={[styles.modeChip, allDay && styles.modeChipOn]}
                  onPress={() => setAllDay(true)}
                >
                  <Text style={[styles.modeText, allDay && styles.modeTextOn]}>Remind all day</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeChip, !allDay && styles.modeChipOn]}
                  onPress={() => setAllDay(false)}
                >
                  <Text style={[styles.modeText, !allDay && styles.modeTextOn]}>Remind once</Text>
                </TouchableOpacity>
              </View>
              {allDay ? (
                <View style={styles.hourRow}>
                  {ALL_DAY_HOURS.map((h) => (
                    <View key={h} style={[styles.hourChip, styles.hourChipOn]}>
                      <Text style={[styles.hourText, styles.hourTextOn]}>{labelHour(h)}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.hourRow}>
                  {HOUR_CHIPS.map((h) => (
                    <TouchableOpacity
                      key={h}
                      style={[styles.hourChip, hour === h && styles.hourChipOn]}
                      onPress={() => setHour(h)}
                    >
                      <Text style={[styles.hourText, hour === h && styles.hourTextOn]}>{labelHour(h)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          ) : null}
          <TouchableOpacity style={styles.addBtn} onPress={saveNote} activeOpacity={0.85}>
            <Icon name="plus" size={20} color={colors.onPrimary} />
            <Text style={styles.addBtnText}>
              {pointCount > 1 ? `Add ${pointCount} points` : 'Add point'}
            </Text>
          </TouchableOpacity>
        </View>

        {visibleNotes.length === 0 ? (
          <Text style={styles.empty}>No points yet. Add a line for each topic, then Keep always or Today only.</Text>
        ) : (
          <View style={styles.listPad}>
            {visibleNotes.map((n, index) => (
              <View key={n.id} style={[styles.pointRow, n.done && styles.pointRowDone]}>
                <Text style={styles.pointIndex}>{index + 1}.</Text>
                <TouchableOpacity onPress={() => toggleNote(n.id)} style={styles.rowTap}>
                  <Icon
                    name={n.done ? 'checkbox-marked-outline' : 'checkbox-blank-outline'}
                    size={22}
                    color={n.done ? colors.primary : colors.textMuted}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.noteText, n.done && styles.noteDone]}>{n.text}</Text>
                    <Text style={styles.meta}>
                      {n.keepAlways
                        ? n.remindAllDay
                          ? 'Keep always · reminder all day'
                          : `Keep always · reminder ${labelHour(n.remindHour ?? 9)}`
                        : 'Today only'}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteNote(n.id)} hitSlop={8}>
                  <Icon name="close" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <Text style={[styles.section, { marginTop: 22 }]}>Important reminders</Text>
        <Text style={styles.hint}>
          One line = one reminder. All day = several pings each day. Once a day = one ping. Reminders stay until you delete them.
        </Text>
        <View style={styles.composer}>
          <View style={styles.padHeader}>
            <Icon name="bell-outline" size={18} color={colors.primary} />
            <Text style={styles.padHeaderText}>Write reminders (Enter for next line)</Text>
          </View>
          <TextInput
            style={styles.padInput}
            value={remText}
            onChangeText={setRemText}
            placeholder={'• Revise OS notes\n• Pay bill\n• Pack gym bag'}
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
          />
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeChip, allDay && styles.modeChipOn]}
              onPress={() => setAllDay(true)}
            >
              <Text style={[styles.modeText, allDay && styles.modeTextOn]}>All day</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeChip, !allDay && styles.modeChipOn]}
              onPress={() => setAllDay(false)}
            >
              <Text style={[styles.modeText, !allDay && styles.modeTextOn]}>Once a day</Text>
            </TouchableOpacity>
          </View>
          {allDay ? (
            <View style={styles.hourRow}>
              {ALL_DAY_HOURS.map((h) => (
                <View key={h} style={[styles.hourChip, styles.hourChipOn]}>
                  <Text style={[styles.hourText, styles.hourTextOn]}>{labelHour(h)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.hourRow}>
              {HOUR_CHIPS.map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[styles.hourChip, hour === h && styles.hourChipOn]}
                  onPress={() => setHour(h)}
                >
                  <Text style={[styles.hourText, hour === h && styles.hourTextOn]}>{labelHour(h)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <TouchableOpacity style={styles.addBtn} onPress={saveReminder} activeOpacity={0.85}>
            <Icon name="bell-plus-outline" size={20} color={colors.onPrimary} />
            <Text style={styles.addBtnText}>
              {remPointCount > 1 ? `Set ${remPointCount} reminders` : 'Set reminder'}
            </Text>
          </TouchableOpacity>
        </View>

        {reminders.length === 0 ? (
          <Text style={styles.empty}>No reminders yet. Add a line for each one.</Text>
        ) : (
          <View style={styles.listPad}>
            {reminders.map((r, index) => (
              <View key={r.id} style={[styles.pointRow, !r.enabled && styles.pointRowDone]}>
                <Text style={styles.pointIndex}>{index + 1}.</Text>
                <TouchableOpacity onPress={() => toggleReminder(r.id)} style={styles.rowTap}>
                  <Icon
                    name={r.enabled ? 'bell-ring-outline' : 'bell-off-outline'}
                    size={22}
                    color={r.enabled ? colors.primary : colors.textMuted}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.noteText, !r.enabled && styles.noteDone]}>{r.title}</Text>
                    <Text style={styles.meta}>
                      {r.allDay
                        ? `All day · ${ALL_DAY_HOURS.map(labelHour).join(', ')}`
                        : `Once a day at ${labelHour(r.hour)}`}
                      {r.enabled ? '' : ' · paused'}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteReminder(r.id)} hitSlop={8}>
                  <Icon name="close" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

function createStyles(c: ThemeColors, extra: { shadow: AppShadow; typography: AppTypography }) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { paddingHorizontal: 20, paddingBottom: 40 },
    back: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginLeft: -8 },
    backText: { fontSize: 16, color: c.textSecondary, fontWeight: '600' },
    kicker: {
      ...extra.typography.small,
      color: c.primary,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    title: { ...extra.typography.h1, marginTop: 4, marginBottom: 6 },
    subtitle: { ...extra.typography.body, marginBottom: 20 },
    section: { ...extra.typography.h3, marginBottom: 10 },
    hint: { ...extra.typography.small, marginBottom: 10, marginTop: -4 },
    composer: {
      backgroundColor: c.surface,
      borderRadius: Radius.md,
      padding: 12,
      marginBottom: 12,
      ...extra.shadow.card,
    },
    input: {
      minHeight: 44,
      color: c.text,
      fontSize: 15,
      paddingHorizontal: 8,
      paddingVertical: 8,
    },
    padHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, paddingHorizontal: 4 },
    padHeaderText: { ...extra.typography.small, color: c.primary, fontWeight: '700' },
    padInput: {
      minHeight: 110,
      color: c.text,
      fontSize: 16,
      lineHeight: 24,
      paddingHorizontal: 10,
      paddingVertical: 8,
      backgroundColor: c.background,
      borderRadius: Radius.sm,
    },
    listPad: {
      backgroundColor: c.surface,
      borderRadius: Radius.md,
      paddingVertical: 4,
      marginBottom: 8,
      ...extra.shadow.card,
    },
    pointRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    pointRowDone: { opacity: 0.7 },
    pointIndex: {
      width: 22,
      fontSize: 14,
      fontWeight: '700',
      color: c.primary,
    },
    addBtn: {
      marginTop: 8,
      backgroundColor: c.primary,
      borderRadius: Radius.md,
      paddingVertical: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
    },
    addBtnText: { color: c.onPrimary, fontWeight: '700', fontSize: 15 },
    empty: { ...extra.typography.small, marginBottom: 8 },
    card: {
      backgroundColor: c.surface,
      borderRadius: Radius.md,
      padding: 12,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      ...extra.shadow.card,
    },
    rowTap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    noteText: { flex: 1, color: c.text, fontSize: 15, fontWeight: '600' },
    noteDone: { textDecorationLine: 'line-through', color: c.textMuted, fontWeight: '500' },
    meta: { ...extra.typography.small, marginTop: 2 },
    modeRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
    modeChip: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: Radius.full,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
    },
    modeChipOn: { backgroundColor: c.primary, borderColor: c.primary },
    modeText: { fontWeight: '700', fontSize: 13, color: c.textSecondary },
    modeTextOn: { color: c.onPrimary },
    hourRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
    hourChip: {
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: Radius.full,
      borderWidth: 1,
      borderColor: c.border,
    },
    hourChipOn: { backgroundColor: c.primarySoft, borderColor: c.primary },
    hourText: { fontSize: 12, fontWeight: '700', color: c.textSecondary },
    hourTextOn: { color: c.primaryDark },
  });
}

export default NotesScreen;
