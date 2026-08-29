import { create } from 'zustand';
import { NativeModules, PermissionsAndroid, Platform, TurboModuleRegistry } from 'react-native';
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

type DayRecord = { steps: number; waterIntake: number; caloriesBurned: number; activeMinutes: number };

function caloriesFromSteps(steps: number): number {
  return Math.round(steps * 0.04);
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

/** Returns true only when the native StepCounter module is actually linked (old or new arch). */
function isStepCounterNativeModuleAvailable(): boolean {
  if (NativeModules?.StepCounter != null) return true;
  try {
    return TurboModuleRegistry.get('StepCounter') != null;
  } catch {
    return false;
  }
}

/**
 * Start counting steps from device sensor. Never require the JS package unless the native
 * module exists – the package throws during load when it isn't linked, and that can crash the app.
 */
function startDeviceStepCounter(
  baseSteps: number,
  onStepData?: (total: number, distance: string) => void
): boolean {
  if (!isStepCounterNativeModuleAvailable()) return false;

  try {
    const pkg = require('@dongminyu/react-native-step-counter');
    const { startStepCounterUpdate, stopStepCounterUpdate, parseStepData } = pkg;
    const startDate = new Date();
    const sub = startStepCounterUpdate(startDate, (data: { steps: number; distance: number; startDate: number; endDate: number; counterType: string }) => {
      const steps = data?.steps ?? 0;
      const total = baseSteps + steps;
      const parsed = parseStepData(data);
      useActivityStore.getState().updateSteps(total);
      onStepData?.(total, parsed.distance);
    });
    stepCounterSubscription = {
      remove: () => {
        try {
          if (sub?.remove) sub.remove();
          stopStepCounterUpdate();
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
    set({ isLoading: true, error: null });
    try {
      const today = getDateKey(new Date());
      let localRecords: Record<string, DayRecord> = {};
      try {
        const raw = await AsyncStorage.getItem(RECORDS_KEY);
        if (raw) localRecords = JSON.parse(raw);
      } catch {
        // ignore
      }

      let remote: Record<string, { steps: number; waterIntake: number; caloriesBurned: number; activeMinutes: number }> =
        {};
      try {
        const { loadActivityRangeFromFirestore } = await import('../services/firestoreSync');
        remote = await loadActivityRangeFromFirestore(30);
      } catch {
        // offline
      }

      const merged: Record<string, DayRecord> = { ...localRecords };
      Object.entries(remote).forEach(([key, rec]) => {
        merged[key] = {
          steps: rec.steps ?? 0,
          waterIntake: rec.waterIntake ?? 0,
          caloriesBurned: rec.caloriesBurned ?? 0,
          activeMinutes: rec.activeMinutes ?? 0,
        };
      });

      const todayRec = merged[today] || { steps: 0, waterIntake: 0, caloriesBurned: 0, activeMinutes: 0 };
      const mockActivity: DailyActivity = {
        id: '1',
        userId: 'user1',
        date: today,
        steps: todayRec.steps,
        waterIntake: todayRec.waterIntake,
        caloriesBurned: todayRec.caloriesBurned,
        activeMinutes: todayRec.activeMinutes,
        sleepHours: 0,
        mood: 'okay',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      set({
        todayActivity: mockActivity,
        dailyRecords: { ...merged, [today]: todayRec },
        isLoading: false,
      });
      persistRecords({ ...merged, [today]: todayRec });
    } catch {
      set({ error: 'Failed to fetch activity data', isLoading: false });
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
          { title: 'Step counting', message: 'Allow to count steps when you walk.', buttonNeutral: 'Later', buttonPositive: 'OK' }
        );
      } catch {
        // continue
      }
    }

    const useSensor = startDeviceStepCounter(baseSteps, onStepData) || startIOSPedometer(baseSteps);
    if (useSensor) {
      set({ isWalkTracking: true, isUsingDeviceSensor: true, error: null });
      return;
    }

    // No native step sensor — do not simulate steps
    set({
      isWalkTracking: false,
      isUsingDeviceSensor: false,
      error:
        'Step sensor not available on this device/build. Steps will not increase until a real pedometer is linked (rebuild the Android app).',
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
    const waterIntake = current.waterIntake + amount;
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
    if (current) set({ todayActivity: { ...current, mood } });
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
