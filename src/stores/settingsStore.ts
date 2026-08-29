import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Settings = {
  notificationsEnabled: boolean;
  hydrationReminderInterval: number;
  stepGoal: number;
  waterGoal: number;
  theme: 'light' | 'dark';
  healthTipVoiceEnabled: boolean;
};

interface SettingsState {
  settings: Settings;
  isLoading: boolean;
  error: string | null;
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
}

const defaultSettings: Settings = {
  notificationsEnabled: true,
  hydrationReminderInterval: 120,
  stepGoal: 10000,
  waterGoal: 2000,
  theme: 'light',
  healthTipVoiceEnabled: true,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,
  isLoading: false,
  error: null,

  loadSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const stored = await AsyncStorage.getItem('userSettings');
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        set({ settings: { ...defaultSettings, ...parsedSettings }, isLoading: false });
      } else {
        set({ settings: defaultSettings, isLoading: false });
      }
    } catch (error) {
      set({ error: 'Failed to load settings', isLoading: false });
    }
  },

  updateSettings: async (updates) => {
    const currentSettings = get().settings;
    const newSettings = { ...currentSettings, ...updates };

    try {
      await AsyncStorage.setItem('userSettings', JSON.stringify(newSettings));
      set({ settings: newSettings });
      if (updates.stepGoal != null) {
        const { usePedometerStore } = require('./pedometerStore') as typeof import('./pedometerStore');
        usePedometerStore.getState().setDailyGoal(updates.stepGoal);
      }
      if (updates.notificationsEnabled != null || updates.hydrationReminderInterval != null) {
        const { useNotificationStore } = require('./notificationStore') as typeof import('./notificationStore');
        await useNotificationStore.getState().scheduleDailyReminders();
      }
    } catch (error) {
      set({ error: 'Failed to save settings' });
    }
  },
}));



