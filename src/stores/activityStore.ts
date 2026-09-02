import { create } from 'zustand';
import { DeviceEventEmitter, NativeModules, PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyActivity } from '../types';

export type PeriodFilter = 'today' | 'weekly' | 'monthly' | 'yearly';

export interface PeriodStats {
  steps: number;
  waterIntake: number;
  caloriesBurned: number;
  activeMinutes: number;
}

interface ActivityState {
  todayActivity: DailyActivity | null;
  /** Keyed by date YYYY-MM-DD for period aggregation */
  dailyRecords: Record<string, { steps: number; waterIntake: number; caloriesBurned: number; activeMinutes: number }>;
  isLoading: boolean;
  error: string | null;
  isWalkTracking: boolean;
  /** When true, steps only come from device sensor (real walking). When false, sensor unavailable. */
  isUsingDeviceSensor: boolean;
  fetchTodayActivity: () => Promise<void>;
  /** onStepData(total, distance) is called when using native sensor; use it to sync to pedometer store. */
  startWalkTracking: (onStepData?: (total: number, distance: string) => void) => Promise<void>;
  stopWalkTracking: () => void;
  updateSteps: (steps: number) => void;
  addSteps: (delta: number) => void;
  updateWaterIntake: (amount: number) => void;
  updateCalories: (calories: number) => void;
  updateMood: (mood: NonNullable<DailyActivity['mood']>) => void;
  getStatsForPeriod: (period: PeriodFilter) => PeriodStats;
  getDailySeries: (days: number) => { labels: string[]; steps: number[]; water: number[] };
}

let stepCounterSubscription: { remove: () => void } | null = null;
let pedometerSubscription: { remove: () => void } | null = null;
let demoModeTimer: ReturnType<typeof setTimeout> | null = null;

function getDateKey(d: Date): string {
  return d.toISOString().split('T')[0];
}

const RECORDS_KEY = '@health_daily_records';
const MOOD_KEY = '@health_today_mood';

type SavedMood = { date: string; mood: NonNullable<DailyActivity['mood']> };

async function persistMood(date: string, mood: NonNullable<DailyActivity['mood']>) {
  try {
    const payload: SavedMood = { date, mood };
    await AsyncStorage.setItem(MOOD_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

async function loadMood(date: string): Promise<DailyActivity['mood'] | undefined> {
  try {
    const raw = await AsyncStorage.getItem(MOOD_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as SavedMood;
    if (parsed.date === date && parsed.mood) return parsed.mood;
  } catch {
    // ignore
  }
  return undefined;
}

type DayRecord = { steps: number; waterIntake: number; caloriesBurned: number; activeMinutes: number };

function caloriesFromSteps(steps: number): number {
  return Math.round(Math.max(0, steps) * 0.04);
}

function emptyDay(): DayRecord {
  return { steps: 0, waterIntake: 0, caloriesBurned: 0, activeMinutes: 0 };
}

function activityFromRecord(
  today: string,
  rec: DayRecord,
  mood?: DailyActivity['mood']
): DailyActivity {
  return {
    id: '1',
    userId: 'user1',
    date: today,
    steps: rec.steps,
    waterIntake: rec.waterIntake,
    caloriesBurned: rec.caloriesBurned,
    activeMinutes: rec.activeMinutes,
    sleepHours: 0,
    mood,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

async function persistRecords(records: Record<string, DayRecord>) {
  try {
    await AsyncStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  } catch {
    // ignore
  }
}

/** Demo mode disabled: we no longer fake steps. Real sensor only. */
function startDemoMode() {
  // intentionally no-op — steps must come from walking / device sensor
}

/**
 * Start counting real walking motion via the native module (accelerometer step detection).
 * Listen on DeviceEventEmitter so events still arrive if the JS wrapper fails to bind.
 */
function startDeviceStepCounter(
  baseSteps: number,
  onStepData?: (total: number, distance: string) => void
): boolean {
  const native = NativeModules.StepCounter as
    | {
        startStepCounterUpdate?: (from: number) => void;
        stopStepCounterUpdate?: () => void;
        addListener?: (eventName: string) => void;
      }
    | undefined;
  if (!native?.startStepCounterUpdate) return false;

  try {
    const applyStep = (data: { steps?: number; distance?: number } | undefined) => {
      const session = Math.max(0, Math.round(Number(data?.steps ?? 0)));
      const total = baseSteps + session;
      const meters =
        data?.distance != null
          ? Math.round(Number(data.distance))
          : Math.round(session * 0.762);
      const distance =
        meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${meters} m`;
      useActivityStore.getState().updateSteps(total);
      onStepData?.(total, distance);
    };

    native.addListener?.('StepCounter.stepCounterUpdate');
    const sub = DeviceEventEmitter.addListener('StepCounter.stepCounterUpdate', applyStep);
    native.startStepCounterUpdate(0);
    stepCounterSubscription = {
      remove: () => {
        try {
          sub.remove();
        } catch {}
        try {
          native.stopStepCounterUpdate?.();
        } catch {}
      },
    };
    return true;
  } catch {
    return false;
  }
}

/** iOS: use CMPedometer – counts steps only when user walks. */
function startIOSPedometer(baseSteps: number): boolean {
  if (Platform.OS !== 'ios') return false;
  try {
    const Pedometer = require('react-native-pedometer').default;
    const startDate = new Date();
    Pedometer.startPedometerUpdatesFromDate(startDate.getTime(), (data: { numberOfSteps?: number }) => {
      const steps = data?.numberOfSteps ?? 0;
      useActivityStore.getState().updateSteps(baseSteps + steps);
    });
    pedometerSubscription = { remove: () => Pedometer.stopPedometerUpdates?.() };
    return true;
  } catch {
    return false;
  }
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  todayActivity: null,
  dailyRecords: {},
  isLoading: false,
  error: null,
  isWalkTracking: false,
  isUsingDeviceSensor: false,

  fetchTodayActivity: async () => {
    const today = getDateKey(new Date());
    try {
      let localRecords: Record<string, DayRecord> = {};
      try {
        const raw = await AsyncStorage.getItem(RECORDS_KEY);
        if (raw) localRecords = JSON.parse(raw);
      } catch {
        // ignore
      }
      const savedMood = await loadMood(today);
      const localToday = localRecords[today] || emptyDay();
      set({
        todayActivity: get().todayActivity ?? activityFromRecord(today, localToday, savedMood),
        dailyRecords: { ...localRecords, [today]: localToday },
        isLoading: false,
        error: null,
      });

      const refreshRemote = async () => {
        let remote: Record<string, { steps: number; waterIntake: number; caloriesBurned: number; activeMinutes: number }> =
          {};
        try {
          const { loadActivityRangeFromFirestore } = await import('../services/firestoreSync');
          remote = await Promise.race([
            loadActivityRangeFromFirestore(7),
            new Promise<typeof remote>((resolve) => setTimeout(() => resolve({}), 4000)),
          ]);
        } catch {
          return;
        }
        if (!Object.keys(remote).length) return;
        const merged: Record<string, DayRecord> = { ...get().dailyRecords, ...localRecords };
        Object.entries(remote).forEach(([key, rec]) => {
          merged[key] = {
            steps: rec.steps ?? 0,
            waterIntake: rec.waterIntake ?? 0,
            caloriesBurned: rec.caloriesBurned ?? 0,
            activeMinutes: rec.activeMinutes ?? 0,
          };
        });
        const current = get().todayActivity;
        const fromRemote = merged[today] || emptyDay();
        const todayRec: DayRecord = current
          ? {
              steps: current.steps,
              waterIntake: current.waterIntake,
              caloriesBurned: current.caloriesBurned,
              activeMinutes: current.activeMinutes,
            }
          : fromRemote;
        merged[today] = todayRec;
        set({
          todayActivity: current
            ? { ...current, ...todayRec }
            : activityFromRecord(today, todayRec, savedMood),
          dailyRecords: merged,
          isLoading: false,
        });
        persistRecords(merged);
      };
      void refreshRemote();
    } catch {
      const todayRec = emptyDay();
      set({
        todayActivity: get().todayActivity ?? activityFromRecord(today, todayRec),
        isLoading: false,
        error: null,
      });
    }
  },

  startWalkTracking: async (onStepData?: (total: number, distance: string) => void) => {
    const state = get();
    if (state.isWalkTracking) return;
    set({ error: null });
    if (!state.todayActivity) await state.fetchTodayActivity();
    const current = get().todayActivity;
    const baseSteps = current?.steps ?? 0;

    if (Platform.OS === 'android') {
      try {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
          {
            title: 'Step counting',
            message: 'Allow physical activity so steps can be counted while you walk.',
            buttonNeutral: 'Later',
            buttonPositive: 'OK',
          }
        );
      } catch {
        // Accelerometer walking detection still works without this permission.
      }
    }

    const useSensor = startDeviceStepCounter(baseSteps, onStepData) || startIOSPedometer(baseSteps);
    if (useSensor) {
      set({
        isWalkTracking: true,
        isUsingDeviceSensor: true,
        error: null,
      });
      return;
    }

    set({
      isWalkTracking: false,
      isUsingDeviceSensor: false,
      error:
        'Could not start the step sensor. Rebuild the Android app (native pedometer must be linked).',
    });
  },

  stopWalkTracking: () => {
    if (stepCounterSubscription) {
      try { stepCounterSubscription.remove(); } catch {}
      stepCounterSubscription = null;
    }
    if (pedometerSubscription) {
      try { pedometerSubscription.remove(); } catch {}
      pedometerSubscription = null;
    }
    if (demoModeTimer) {
      clearTimeout(demoModeTimer);
      demoModeTimer = null;
    }
    set({ isWalkTracking: false, isUsingDeviceSensor: false });
  },

  updateSteps: (steps: number) => {
    const current = get().todayActivity;
    if (!current) return;
    const today = getDateKey(new Date());
    const activeMinutes = Math.floor(steps / 20);
    const caloriesBurned = caloriesFromSteps(steps);
    const rec: DayRecord = {
      ...(get().dailyRecords[today] || { steps: 0, waterIntake: current.waterIntake, caloriesBurned: 0, activeMinutes: 0 }),
      steps,
      activeMinutes,
      caloriesBurned,
      waterIntake: current.waterIntake,
    };
    const dailyRecords = { ...get().dailyRecords, [today]: rec };
    set({
      todayActivity: { ...current, steps, activeMinutes, caloriesBurned, updatedAt: new Date() },
      dailyRecords,
    });
    persistRecords(dailyRecords);
    import('../services/firestoreSync').then(({ syncTodayActivityToFirestore }) =>
      syncTodayActivityToFirestore({
        steps,
        waterIntake: current.waterIntake,
        caloriesBurned,
        activeMinutes,
      })
    );
  },

  addSteps: (delta: number) => {
    const current = get().todayActivity;
    if (!current || delta <= 0) return;
    const newSteps = current.steps + delta;
    get().updateSteps(newSteps);
  },

  updateWaterIntake: (amount: number) => {
    const current = get().todayActivity;
    if (!current) return;
    const today = getDateKey(new Date());
    const waterIntake = Math.max(0, current.waterIntake + amount);
    set({
      todayActivity: { ...current, waterIntake },
      dailyRecords: {
        ...get().dailyRecords,
        [today]: {
          ...(get().dailyRecords[today] || { steps: 0, waterIntake: 0, caloriesBurned: 0, activeMinutes: 0 }),
          waterIntake,
        },
      },
    });
    persistRecords(get().dailyRecords);
    const a = get().todayActivity;
    if (a) {
      import('../services/firestoreSync').then(({ syncTodayActivityToFirestore }) =>
        syncTodayActivityToFirestore({
          steps: a.steps,
          waterIntake: a.waterIntake,
          caloriesBurned: a.caloriesBurned,
          activeMinutes: a.activeMinutes,
        })
      );
    }
  },

  updateCalories: (calories: number) => {
    const current = get().todayActivity;
    if (!current) return;
    const today = getDateKey(new Date());
    set({
      todayActivity: { ...current, caloriesBurned: current.caloriesBurned + calories },
      dailyRecords: {
        ...get().dailyRecords,
        [today]: {
          ...(get().dailyRecords[today] || { steps: 0, waterIntake: 0, caloriesBurned: 0, activeMinutes: 0 }),
          caloriesBurned: current.caloriesBurned + calories,
        },
      },
    });
  },

  updateMood: (mood: NonNullable<DailyActivity['mood']>) => {
    const current = get().todayActivity;
    if (!current) return;
    const today = getDateKey(new Date());
    set({ todayActivity: { ...current, mood, updatedAt: new Date() } });
    persistMood(today, mood);
  },

  getStatsForPeriod: (period: PeriodFilter): PeriodStats => {
    const now = new Date();
    const records = get().dailyRecords;
    const today = get().todayActivity;

    const result: PeriodStats = { steps: 0, waterIntake: 0, caloriesBurned: 0, activeMinutes: 0 };

    let daysBack: number;
    switch (period) {
      case 'today':
        daysBack = 1;
        break;
      case 'weekly':
        daysBack = 7;
        break;
      case 'monthly':
        daysBack = 30;
        break;
      case 'yearly':
        daysBack = 365;
        break;
      default:
        daysBack = 1;
    }

    for (let i = 0; i < daysBack; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = getDateKey(d);
      const rec = records[key];
      if (rec) {
        result.steps += rec.steps;
        result.waterIntake += rec.waterIntake;
        result.caloriesBurned += rec.caloriesBurned;
        result.activeMinutes += rec.activeMinutes;
      } else if (i === 0 && today && today.date === key) {
        result.steps += today.steps;
        result.waterIntake += today.waterIntake;
        result.caloriesBurned += today.caloriesBurned;
        result.activeMinutes += today.activeMinutes;
      }
    }
    return result;
  },

  getDailySeries: (days: number) => {
    const records = get().dailyRecords;
    const labels: string[] = [];
    const steps: number[] = [];
    const water: number[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = getDateKey(d);
      const rec = records[key];
      labels.push(d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2));
      steps.push(rec?.steps ?? 0);
      water.push(rec?.waterIntake ?? 0);
    }
    return { labels, steps, water };
  },
}));

export const initializeStepCounter = () => {
  console.log('Step counter initialized');
};
