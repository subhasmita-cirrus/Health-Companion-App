import firestore from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';

export type ActivityDoc = {
  steps: number;
  waterIntake: number;
  caloriesBurned: number;
  activeMinutes: number;
  updatedAt: string;
};

function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function uid(): string | null {
  return getAuth().currentUser?.uid ?? null;
}

/** Persist today's activity to Firestore under users/{uid}/daily/{YYYY-MM-DD}. */
export async function syncTodayActivityToFirestore(data: {
  steps: number;
  waterIntake: number;
  caloriesBurned: number;
  activeMinutes: number;
}): Promise<void> {
  const userId = uid();
  if (!userId) return;
  try {
    await firestore()
      .collection('users')
      .doc(userId)
      .collection('daily')
      .doc(todayKey())
      .set(
        {
          ...data,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
  } catch (e) {
    console.warn('[Firestore] sync failed:', e instanceof Error ? e.message : e);
  }
}

/** Load the last `days` of activity docs (one get per day). */
export async function loadActivityRangeFromFirestore(
  days: number
): Promise<Record<string, ActivityDoc>> {
  const userId = uid();
  const out: Record<string, ActivityDoc> = {};
  if (!userId) return out;
  const jobs: Promise<void>[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    jobs.push(
      firestore()
        .collection('users')
        .doc(userId)
        .collection('daily')
        .doc(key)
        .get()
        .then((snap) => {
          if (snap.exists) out[key] = snap.data() as ActivityDoc;
        })
        .catch(() => {})
    );
  }
  await Promise.all(jobs);
  return out;
}

/** Load today's activity from Firestore (if any). */
export async function loadTodayActivityFromFirestore(): Promise<ActivityDoc | null> {
  const userId = uid();
  if (!userId) return null;
  try {
    const snap = await firestore()
      .collection('users')
      .doc(userId)
      .collection('daily')
      .doc(todayKey())
      .get();
    if (!snap.exists) return null;
    return snap.data() as ActivityDoc;
  } catch (e) {
    console.warn('[Firestore] load failed:', e instanceof Error ? e.message : e);
    return null;
  }
}
