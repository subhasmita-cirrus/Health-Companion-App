import { create } from 'zustand';
import { Notification } from '../types';

interface NotificationState {
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => void;
  scheduleNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      // Mock notifications for now
      const mockNotifications: Notification[] = [
        {
          id: '1',
          userId: 'user1',
          type: 'hydration',
          message: "Don't forget to drink water! 💧",
          timestamp: new Date().toISOString(),
          read: false,
        },
        {
          id: '2',
          userId: 'user1',
          type: 'fitness',
          message: 'Time for your daily walk! 🚶‍♀️',
          timestamp: new Date().toISOString(),
          read: false,
        },
      ];
      set({ notifications: mockNotifications, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch notifications', isLoading: false });
    }
  },

  markAsRead: (id: string) => {
    const notifications = get().notifications.map(notification =>
      notification.id === id ? { ...notification, read: true } : notification
    );
    set({ notifications });
  },

  scheduleNotification: async (notificationData) => {
    try {
      // This would integrate with Notifee in a real app
      console.log('Scheduling notification:', notificationData);
    } catch (error) {
      set({ error: 'Failed to schedule notification' });
    }
  },
}));

// Mock notification initialization
export const initializeNotifications = async () => {
  // This would initialize Notifee and request permissions in a real app
  console.log('Notifications initialized');
};



