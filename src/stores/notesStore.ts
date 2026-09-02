import { create } from 'zustand';
import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  RepeatFrequency,
  TriggerType,
} from '@notifee/react-native';
import { AppConstants } from '../constants';
import firestore from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';

const NOTES_KEY = '@health_study_notes';
const REMINDERS_KEY = '@health_important_reminders';

/** Hours used when “all day” is on (covers morning → evening). */
export const ALL_DAY_HOURS = [9, 11, 13, 15, 17, 19, 21];

export type StudyNote = {
  id: string;
  date: string;
  text: string;
  done: boolean;
  createdAt: string;
  /** When true, the point stays on the list every day until deleted. */
  keepAlways: boolean;
  remindHour: number;
  remindAllDay: boolean;
};

export type ImportantReminder = {
  id: string;
  title: string;
  allDay: boolean;
  hour: number;
  enabled: boolean;
  createdAt: string;
};

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isNoteVisibleToday(note: StudyNote, day = todayKey()): boolean {
  return note.keepAlways === true || note.date === day;
}

function uid(): string | null {
  return getAuth().currentUser?.uid ?? null;
}

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function parsePointLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter(Boolean);
}

function nextTimestamp(hour: number, allowTomorrow: boolean): number | null {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  if (d.getTime() > Date.now() + 20_000) return d.getTime();
  if (!allowTomorrow) return null;
  d.setDate(d.getDate() + 1);
  return d.getTime();
}

function normalizeNotes(raw: StudyNote[]): StudyNote[] {
  return raw.map((n) => ({
    ...n,
    keepAlways: typeof n.keepAlways === 'boolean' ? n.keepAlways : true,
    remindHour: typeof n.remindHour === 'number' ? n.remindHour : 9,
    remindAllDay: n.remindAllDay === true,
  }));
}

async function ensureNotifyReady(): Promise<boolean> {
  await notifee.createChannel({
    id: AppConstants.NOTIFICATION_CHANNEL_ID,
    name: AppConstants.NOTIFICATION_CHANNEL_NAME,
    importance: AndroidImportance.HIGH,
  });
  if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (result !== PermissionsAndroid.RESULTS.GRANTED) return false;
  }
  const settings = await notifee.requestPermission();
  return (
    settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
  );
}

type PingTarget = {
  id: string;
  heading: string;
  body: string;
  allDay: boolean;
  hour: number;
  enabled: boolean;
};

async function persistNotes(notes: StudyNote[]) {
  await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

async function persistReminders(reminders: ImportantReminder[]) {
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
}

async function cancelReminderAlarms(id: string) {
  const hours = [id, ...ALL_DAY_HOURS.map((h) => `${id}-${h}`), `${id}-once`];
  await Promise.all(hours.map((n) => notifee.cancelNotification(n).catch(() => {})));
}

async function scheduleReminderAlarms(item: PingTarget) {
  await cancelReminderAlarms(item.id);
  if (!item.enabled) return;
  const ok = await ensureNotifyReady();
  if (!ok) return;

  const hours = item.allDay ? ALL_DAY_HOURS : [item.hour];
  for (const hour of hours) {
    const ts = nextTimestamp(hour, true);
    if (ts == null) continue;
    const nid = item.allDay ? `${item.id}-${hour}` : `${item.id}-once`;
    await notifee.createTriggerNotification(
      {
        id: nid,
        title: item.heading,
        body: item.body,
        android: {
          channelId: AppConstants.NOTIFICATION_CHANNEL_ID,
          pressAction: { id: 'default' },
        },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: ts,
        repeatFrequency: RepeatFrequency.DAILY,
        alarmManager: { allowWhileIdle: true },
      },
    );
  }
}

function reminderPing(reminder: ImportantReminder): PingTarget {
  return {
    id: reminder.id,
    heading: reminder.allDay ? 'All-day reminder' : 'Reminder',
    body: reminder.title,
    allDay: reminder.allDay,
    hour: reminder.hour,
    enabled: reminder.enabled,
  };
}

function notePing(note: StudyNote): PingTarget {
  return {
    id: note.id,
    heading: 'Study reminder',
    body: note.text,
    allDay: note.remindAllDay,
    hour: note.remindHour,
    enabled: note.keepAlways,
  };
}

async function syncNotesCloud(notes: StudyNote[], reminders: ImportantReminder[]) {
  const userId = uid();
  if (!userId) return;
  try {
    await firestore().collection('users').doc(userId).collection('planner').doc('current').set(
      { notes, reminders, updatedAt: new Date().toISOString() },
      { merge: true },
    );
  } catch (e) {
    console.warn('[Notes] cloud sync skipped:', e instanceof Error ? e.message : e);
  }
}

interface NotesState {
  notes: StudyNote[];
  reminders: ImportantReminder[];
  loaded: boolean;
  loadPlanner: () => Promise<void>;
  addNote: (text: string, keepAlways?: boolean, hour?: number, allDay?: boolean) => Promise<void>;
  toggleNote: (id: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  addReminder: (title: string, allDay: boolean, hour: number) => Promise<void>;
  toggleReminder: (id: string) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  reminders: [],
  loaded: false,

  loadPlanner: async () => {
    try {
      const [nRaw, rRaw] = await Promise.all([
        AsyncStorage.getItem(NOTES_KEY),
        AsyncStorage.getItem(REMINDERS_KEY),
      ]);
      let notes: StudyNote[] = normalizeNotes(nRaw ? JSON.parse(nRaw) : []);
      let reminders: ImportantReminder[] = rRaw ? JSON.parse(rRaw) : [];

      const userId = uid();
      if (userId) {
        try {
          const snap = await firestore()
            .collection('users')
            .doc(userId)
            .collection('planner')
            .doc('current')
            .get();
          if (snap.exists) {
            const data = snap.data() as { notes?: StudyNote[]; reminders?: ImportantReminder[] };
            if (data.notes?.length) notes = normalizeNotes(data.notes);
            if (data.reminders?.length) reminders = data.reminders;
          }
        } catch {
          // keep local
        }
      }

      set({ notes, reminders, loaded: true });
      void persistNotes(notes);
      for (const note of notes) {
        if (note.keepAlways) await scheduleReminderAlarms(notePing(note));
      }
      for (const rem of reminders) {
        if (rem.enabled) await scheduleReminderAlarms(reminderPing(rem));
      }
    } catch {
      set({ loaded: true });
    }
  },

  addNote: async (text, keepAlways = true, hour = 9, allDay = false) => {
    const lines = parsePointLines(text);
    if (!lines.length) return;
    const stamp = new Date().toISOString();
    const date = todayKey();
    const added: StudyNote[] = lines.map((line, i) => ({
      id: newId(`note${i}`),
      date,
      text: line,
      done: false,
      createdAt: stamp,
      keepAlways,
      remindHour: hour,
      remindAllDay: keepAlways ? allDay : false,
    }));
    const notes = [...added, ...get().notes];
    set({ notes });
    await persistNotes(notes);
    if (keepAlways) {
      for (const note of added) {
        await scheduleReminderAlarms(notePing(note));
      }
    }
    void syncNotesCloud(notes, get().reminders);
  },

  toggleNote: async (id) => {
    const notes = get().notes.map((n) => (n.id === id ? { ...n, done: !n.done } : n));
    set({ notes });
    await persistNotes(notes);
    void syncNotesCloud(notes, get().reminders);
  },

  deleteNote: async (id) => {
    await cancelReminderAlarms(id);
    const notes = get().notes.filter((n) => n.id !== id);
    set({ notes });
    await persistNotes(notes);
    void syncNotesCloud(notes, get().reminders);
  },

  addReminder: async (title, allDay, hour) => {
    const lines = parsePointLines(title);
    if (!lines.length) return;
    const stamp = new Date().toISOString();
    const added: ImportantReminder[] = lines.map((line, i) => ({
      id: newId(`rem${i}`),
      title: line,
      allDay,
      hour,
      enabled: true,
      createdAt: stamp,
    }));
    const reminders = [...added, ...get().reminders];
    set({ reminders });
    await persistReminders(reminders);
    for (const reminder of added) {
      await scheduleReminderAlarms(reminderPing(reminder));
    }
    void syncNotesCloud(get().notes, reminders);
  },

  toggleReminder: async (id) => {
    const reminders = get().reminders.map((r) =>
      r.id === id ? { ...r, enabled: !r.enabled } : r,
    );
    set({ reminders });
    await persistReminders(reminders);
    const next = reminders.find((r) => r.id === id);
    if (next) await scheduleReminderAlarms(reminderPing(next));
    void syncNotesCloud(get().notes, reminders);
  },

  deleteReminder: async (id) => {
    await cancelReminderAlarms(id);
    const reminders = get().reminders.filter((r) => r.id !== id);
    set({ reminders });
    await persistReminders(reminders);
    void syncNotesCloud(get().notes, reminders);
  },
}));
