import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { TriggerType, RepeatFrequency } from '@notifee/react-native';
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
  return new Date().toISOString().split('T')[0];
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

async function scheduleReminderAlarms(reminder: ImportantReminder) {
  await cancelReminderAlarms(reminder.id);
  if (!reminder.enabled) return;

  const hours = reminder.allDay ? ALL_DAY_HOURS : [reminder.hour];
  for (const hour of hours) {
    const ts = nextTimestamp(hour, true);
    if (ts == null) continue;
    const nid = reminder.allDay ? `${reminder.id}-${hour}` : `${reminder.id}-once`;
    await notifee.createTriggerNotification(
      {
        id: nid,
        title: reminder.allDay ? 'All-day reminder' : 'Reminder',
        body: reminder.title,
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
  addNote: (text: string) => Promise<void>;
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
      let notes: StudyNote[] = nRaw ? JSON.parse(nRaw) : [];
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
            if (data.notes?.length) notes = data.notes;
            if (data.reminders?.length) reminders = data.reminders;
          }
        } catch {
          // keep local
        }
      }

      set({ notes, reminders, loaded: true });
      for (const rem of reminders) {
        if (rem.enabled) await scheduleReminderAlarms(rem);
      }
    } catch {
      set({ loaded: true });
    }
  },

  addNote: async (text) => {
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
    }));
    const notes = [...added, ...get().notes];
    set({ notes });
    await persistNotes(notes);
    void syncNotesCloud(notes, get().reminders);
  },

  toggleNote: async (id) => {
    const notes = get().notes.map((n) => (n.id === id ? { ...n, done: !n.done } : n));
    set({ notes });
    await persistNotes(notes);
    void syncNotesCloud(notes, get().reminders);
  },

  deleteNote: async (id) => {
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
      await scheduleReminderAlarms(reminder);
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
    if (next) await scheduleReminderAlarms(next);
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
