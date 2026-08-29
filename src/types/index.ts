// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  profileImage?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  height?: number; // in cm
  weight?: number; // in kg
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  goals?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Activity Types
export interface DailyActivity {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  steps: number;
  waterIntake: number; // in ml
  caloriesBurned: number;
  activeMinutes: number;
  sleepHours?: number;
  mood?: 'excellent' | 'good' | 'okay' | 'poor' | 'terrible';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Water Intake Entry
export interface WaterEntry {
  id: string;
  userId: string;
  amount: number; // in ml
  timestamp: Date;
  type?: 'glass' | 'bottle' | 'custom';
}

// Step Counter
export interface StepData {
  steps: number;
  distance: number; // in meters
  calories: number;
  timestamp: Date;
}

// Health Tips
export interface HealthTip {
  id: string;
  title: string;
  content: string;
  category: 'fitness' | 'nutrition' | 'wellness' | 'mental-health' | 'general';
  priority: 'low' | 'medium' | 'high';
  isRead: boolean;
  createdAt: Date;
}

// Notification Types
export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'water' | 'steps' | 'reminder' | 'tip' | 'achievement';
  scheduledTime?: Date;
  isRead: boolean;
  createdAt: Date;
}

// Reminder Settings
export interface ReminderSettings {
  waterReminders: {
    enabled: boolean;
    interval: number; // in hours
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
  };
  stepReminders: {
    enabled: boolean;
    dailyGoal: number;
    reminderTimes: string[]; // Array of HH:MM format times
  };
  healthTips: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string; // HH:MM format
  };
}

// App Settings
export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  units: 'metric' | 'imperial';
  notifications: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
  };
  privacy: {
    shareData: boolean;
    analytics: boolean;
  };
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Home: undefined;
  Activity: undefined;
  Tips: undefined;
  Profile: undefined;
  Settings: undefined;
  Notes: undefined;
  EditProfile: undefined;
  WaterIntake: undefined;
  StepCounter: undefined;
  HealthTips: undefined;
  Notifications: undefined;
};

// Store Types
export interface UserStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  setUser: (user: User | null) => void;
}

export interface ActivityStore {
  todayActivity: DailyActivity | null;
  weeklyActivities: DailyActivity[];
  isLoading: boolean;
  fetchTodayActivity: () => Promise<void>;
  fetchWeeklyActivities: () => Promise<void>;
  updateSteps: (steps: number) => Promise<void>;
  updateWaterIntake: (amount: number) => Promise<void>;
  addWaterEntry: (entry: WaterEntry) => Promise<void>;
}

export interface SettingsStore {
  settings: AppSettings;
  reminderSettings: ReminderSettings;
  isLoading: boolean;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  updateReminderSettings: (settings: Partial<ReminderSettings>) => Promise<void>;
  loadSettings: () => Promise<void>;
}

export interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  scheduleNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => Promise<void>;
}

export interface TipsStore {
  tips: HealthTip[];
  isLoading: boolean;
  fetchTips: () => Promise<void>;
  generatePersonalizedTip: () => Promise<HealthTip>;
  markTipAsRead: (tipId: string) => Promise<void>;
}



