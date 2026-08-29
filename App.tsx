/**
 * Health Companion App
 * A comprehensive mobile health assistant built with React Native
 *
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { MD3LightTheme, Provider as PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Stores
import { useUserStore } from './src/stores/userStore';
import { getAuth, getIdToken, signOut } from '@react-native-firebase/auth';
import { useActivityStore } from './src/stores/activityStore';
import { usePedometerStore } from './src/stores/pedometerStore';
import { useNotificationStore } from './src/stores/notificationStore';
import { useSettingsStore } from './src/stores/settingsStore';

// Screens
import AuthScreen from './src/screens/AuthScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import LoadingScreen from './src/screens/LoadingScreen';

// Services
import { initializeNotifications } from './src/stores/notificationStore';
import { initializeStepCounter } from './src/stores/activityStore';

// Constants
import { Colors } from './src/constants';

const Stack = createStackNavigator();

const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    surface: Colors.white,
    error: Colors.error,
  },
};

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const { isAuthenticated, isLoading, setLoading, restoreSession, setSessionFromFirebase, syncWithBackendInBackground } = useUserStore();
  const { fetchTodayActivity } = useActivityStore();
  const { fetchNotifications } = useNotificationStore();
  const { loadSettings } = useSettingsStore();

  useEffect(() => {
    const SESSION_TIMEOUT_MS = 8000;

    const initializeApp = async () => {
      try {
        const auth = getAuth();
        const firebaseUser = auth.currentUser;

        if (firebaseUser) {
          try {
            const token = await getIdToken(firebaseUser);
            try {
              await Promise.race([
                restoreSession(token),
                new Promise<void>((_, reject) =>
                  setTimeout(() => reject(new Error('timeout')), SESSION_TIMEOUT_MS)
                ),
              ]);
            } catch {
              setSessionFromFirebase(token, {
                uid: firebaseUser.uid,
                email: firebaseUser.email ?? null,
                displayName: firebaseUser.displayName ?? null,
                photoURL: firebaseUser.photoURL ?? null,
              });
              syncWithBackendInBackground();
            }
          } catch {
            // Stale/deleted Firebase user (e.g. auth/user-not-found) — clear and show login
            try {
              await signOut(auth);
            } catch {
              // ignore
            }
          }
        }

        setLoading(false);

        initializeNotifications();
        initializeStepCounter();
        loadSettings();
        if (useUserStore.getState().isAuthenticated) {
          await fetchTodayActivity();
          await usePedometerStore.getState().loadPersisted();
          usePedometerStore.getState().initializeStepsForTheDay();
          fetchNotifications();
        } else {
          // Still set up channels; reminders after login
        }
      } catch (error) {
        // Don't surface init errors to the UI — stay on auth/loading safely
        console.warn('App init recovered:', error instanceof Error ? error.message : error);
        setLoading(false);
      }
    };

    initializeApp();
  }, [restoreSession, setSessionFromFirebase, setLoading, syncWithBackendInBackground, fetchTodayActivity, fetchNotifications, loadSettings]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={paperTheme}>
          <NavigationContainer>
            <StatusBar
              barStyle={isDarkMode ? 'light-content' : 'dark-content'}
              backgroundColor={Colors.background}
            />
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
                cardStyle: { backgroundColor: Colors.background },
              }}
            >
              {isLoading ? (
                <Stack.Screen name="Loading" component={LoadingScreen} />
              ) : isAuthenticated ? (
                <Stack.Screen name="Main" component={MainTabNavigator} />
              ) : (
                <Stack.Screen name="Auth" component={AuthScreen} />
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
