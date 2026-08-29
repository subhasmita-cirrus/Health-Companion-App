import { create } from 'zustand';
import { Platform, PermissionsAndroid } from 'react-native';
import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  TriggerType,
  TimestampTrigger,
} from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import { AppConstants } from '../constants';

export type AppNotification = {
  id: string;
  userId: string;
  type: 'hydration' | 'fitness' | 'tip' | 'general';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
};

interface NotificationState {
  notifications: AppNotification[];
  fcmToken: string | null;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => void;
  scheduleNotification: (notification: {
    type: AppNotification['type'];
    title: string;
    message: string;
    delayMinutes?: number;
  }) => Promise<void>;
  scheduleDailyReminders: () => Promise<void>;
}

async function ensureAndroidChannel() {
  await notifee.createChannel({
    id: AppConstants.NOTIFICATION_CHANNEL_ID,
    name: AppConstants.NOTIFICATION_CHANNEL_NAME,
    importance: AndroidImportance.HIGH,
  });
}

async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    if (result !== PermissionsAndroid.RESULTS.GRANTED) return false;
  }
  const settings = await notifee.requestPermission();
  return (
    settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
  );
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  fcmToken: null,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    const seeded: AppNotification[] = [
      {
        id: 'seed-water',
        userId: 'local',
        type: 'hydration',
        title: 'Hydration',
        message: "Don't forget to drink water!",
        timestamp: new Date().toISOString(),
        read: false,
      },
      {
        id: 'seed-walk',
        userId: 'local',
        type: 'fitness',
        title: 'Activity',
        message: 'Time for your daily walk!',
        timestamp: new Date().toISOString(),
        read: false,
      },
    ];
    set({ notifications: seeded, isLoading: false });
  },

  markAsRead: (id) => {
    set({
      notifications: get().notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    });
  },

  scheduleNotification: async ({ type, title, message, delayMinutes = 1 }) => {
    try {
      await ensureAndroidChannel();
      const ok = await requestNotificationPermission();
      if (!ok) {
        set({ error: 'Notification permission denied' });
        return;
      }

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: Date.now() + Math.max(1, delayMinutes) * 60 * 1000,
      };

      const id = await notifee.createTriggerNotification(
        {
          title,
          body: message,
          android: {
            channelId: AppConstants.NOTIFICATION_CHANNEL_ID,
            pressAction: { id: 'default' },
          },
        },
        trigger
      );

      const entry: AppNotification = {
        id: String(id),
        userId: 'local',
        type,
        title,
        message,
        timestamp: new Date().toISOString(),
        read: false,
      };
      set({ notifications: [entry, ...get().notifications], error: null });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : 'Failed to schedule notification',
      });
    }
  },

  scheduleDailyReminders: async () => {
    try {
      await ensureAndroidChannel();
      const ok = await requestNotificationPermission();
      if (!ok) return;

      // Immediate displayable reminder (works on emulator without waiting)
      await notifee.displayNotification({
        title: 'Health Companion',
        body: 'Reminders are on — we will nudge you to drink water and walk.',
        android: {
          channelId: AppConstants.NOTIFICATION_CHANNEL_ID,
          pressAction: { id: 'default' },
        },
      });

      await get().scheduleNotification({
        type: 'hydration',
        title: 'Drink water',
        message: 'Time for a glass of water to stay hydrated.',
        delayMinutes: 120,
      });
      await get().scheduleNotification({
        type: 'fitness',
        title: 'Move a little',
        message: 'Take a short walk to reach your step goal.',
        delayMinutes: 180,
      });
    } catch (e) {
      console.warn('[Notifee] scheduleDailyReminders:', e);
    }
  },
}));

/** Init Notifee channel + FCM permission/token + foreground message handler. */
export const initializeNotifications = async () => {
  try {
    await ensureAndroidChannel();
    await requestNotificationPermission();

    try {
      await messaging().requestPermission();
      const token = await messaging().getToken();
      useNotificationStore.setState({ fcmToken: token });
      messaging().onMessage(async (remoteMessage) => {
        await ensureAndroidChannel();
        await notifee.displayNotification({
          title: remoteMessage.notification?.title ?? 'Health Companion',
          body: remoteMessage.notification?.body ?? 'You have a new reminder',
          android: {
            channelId: AppConstants.NOTIFICATION_CHANNEL_ID,
            pressAction: { id: 'default' },
          },
        });
      });
    } catch (e) {
      console.warn('[FCM] init skipped:', e instanceof Error ? e.message : e);
    }

    const { scheduleDailyReminders, fetchNotifications } =
      useNotificationStore.getState();
    await fetchNotifications();
    await scheduleDailyReminders();
  } catch (e) {
    console.warn('[Notifications] init failed:', e instanceof Error ? e.message : e);
  }
};
