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
