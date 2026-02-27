import { create } from 'zustand';
import { Activity } from '../types';

interface ActivityState {
  todayActivity: Activity | null;
  isLoading: boolean;
  error: string | null;
  fetchTodayActivity: () => Promise<void>;
  updateSteps: (steps: number) => void;
  updateWaterIntake: (amount: number) => void;
  updateCalories: (calories: number) => void;
  updateMood: (mood: Activity['mood']) => void;
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  todayActivity: null,
  isLoading: false,
  error: null,

  fetchTodayActivity: async () => {
    set({ isLoading: true, error: null });
    try {
      // Mock data for now
      const today = new Date().toISOString().split('T')[0];
      const mockActivity: Activity = {
        id: '1',
        userId: 'user1',
        date: today,
        steps: 0,
        waterIntake: 0,
        caloriesBurned: 0,
        activeMinutes: 0,
        sleepHours: 0,
        mood: 'neutral',
      };
      set({ todayActivity: mockActivity, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch activity data', isLoading: false });
    }
  },

  updateSteps: (steps: number) => {
    const current = get().todayActivity;
    if (current) {
      set({
        todayActivity: { ...current, steps },
      });
    }
  },

  updateWaterIntake: (amount: number) => {
    const current = get().todayActivity;
    if (current) {
      set({
        todayActivity: { ...current, waterIntake: current.waterIntake + amount },
      });
    }
  },

  updateCalories: (calories: number) => {
    const current = get().todayActivity;
    if (current) {
      set({
        todayActivity: { ...current, caloriesBurned: current.caloriesBurned + calories },
      });
    }
  },

  updateMood: (mood: Activity['mood']) => {
    const current = get().todayActivity;
    if (current) {
      set({
        todayActivity: { ...current, mood },
      });
    }
  },
}));

// Mock step counter initialization
export const initializeStepCounter = () => {
  // This would integrate with react-native-pedometer in a real app
  console.log('Step counter initialized');
};



