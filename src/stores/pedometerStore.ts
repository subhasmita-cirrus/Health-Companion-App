import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useActivityStore } from './activityStore';

const PEDOMETER_KEY = '@pedometer';
const DEFAULT_DAILY_GOAL = 10000;

function getDateKey(d: Date): string {
  return d.toISOString().split('T')[0];
}

interface PedometerState {
  stepCount: number;
  dailyGoal: number;
  distance: string;
  startDate: string;
  initializeStepsForTheDay: () => void;
  addSteps: (steps: number, distance?: string) => void;
  /** Set today's total steps (e.g. from native sensor cumulative callback). */
  setSteps: (total: number, distance?: string) => void;
  setDailyGoal: (goal: number) => void;
  loadPersisted: () => Promise<void>;
}

export const usePedometerStore = create<PedometerState>((set, get) => ({
  stepCount: 0,
  dailyGoal: DEFAULT_DAILY_GOAL,
  distance: '0m',
  startDate: getDateKey(new Date()),

  initializeStepsForTheDay: () => {
    const today = getDateKey(new Date());
    const { startDate, stepCount } = get();
    if (today !== startDate) {
      set({ stepCount: 0, startDate: today, distance: '0m' });
      useActivityStore.getState().updateSteps(0);
      AsyncStorage.setItem(PEDOMETER_KEY, JSON.stringify({ stepCount: 0, startDate: today, dailyGoal: get().dailyGoal }));
    }
  },

  addSteps: (steps: number, distance?: string) => {
    get().initializeStepsForTheDay();
    const state = get();
    const newCount = state.stepCount + steps;
    set({
      stepCount: newCount,
      ...(distance !== undefined && { distance }),
    });
    useActivityStore.getState().updateSteps(newCount);
    AsyncStorage.setItem(
      PEDOMETER_KEY,
      JSON.stringify({
        stepCount: newCount,
        startDate: state.startDate,
        dailyGoal: state.dailyGoal,
        distance: distance ?? state.distance,
      })
    );
  },

  setSteps: (total: number, distance?: string) => {
    get().initializeStepsForTheDay();
    set((s) => ({
      stepCount: total,
      ...(distance !== undefined && { distance: distance }),
    }));
    useActivityStore.getState().updateSteps(total);
    const state = get();
    AsyncStorage.setItem(
      PEDOMETER_KEY,
      JSON.stringify({
        stepCount: total,
        startDate: state.startDate,
        dailyGoal: state.dailyGoal,
        distance: distance ?? state.distance,
      })
    );
  },

  setDailyGoal: (goal: number) => {
    set({ dailyGoal: goal });
    AsyncStorage.setItem(PEDOMETER_KEY, JSON.stringify({ ...get(), dailyGoal: goal }));
  },

  loadPersisted: async () => {
    try {
      const raw = await AsyncStorage.getItem(PEDOMETER_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      const today = getDateKey(new Date());
      if (data.startDate === today) {
        set({
          stepCount: data.stepCount ?? 0,
          dailyGoal: data.dailyGoal ?? DEFAULT_DAILY_GOAL,
          distance: data.distance ?? '0m',
          startDate: data.startDate,
        });
        useActivityStore.getState().updateSteps(data.stepCount ?? 0);
      } else {
        set({ stepCount: 0, startDate: today, distance: '0m' });
      }
    } catch {
      // ignore
    }
  },
}));
