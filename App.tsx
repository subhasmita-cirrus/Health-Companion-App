/**
 * Health Companion App
 * A comprehensive mobile health assistant built with React Native
 *
 * @format
 */

import React, { useEffect, useMemo } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DarkTheme as NavDark, DefaultTheme as NavLight, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { MD3DarkTheme, MD3LightTheme, Provider as PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useUserStore } from './src/stores/userStore';
import { getAuth, getIdToken, signOut } from '@react-native-firebase/auth';
import { useActivityStore } from './src/stores/activityStore';
import { usePedometerStore } from './src/stores/pedometerStore';
import { useNotificationStore } from './src/stores/notificationStore';
import { useSettingsStore } from './src/stores/settingsStore';
import { useNotesStore } from './src/stores/notesStore';

import AuthScreen from './src/screens/AuthScreen';
import MainNavigator from './src/navigation/MainNavigator';
import LoadingScreen from './src/screens/LoadingScreen';

import { initializeNotifications } from './src/stores/notificationStore';
import { initializeStepCounter } from './src/stores/activityStore';
import { useAppTheme } from './src/theme/useAppTheme';
import { warmupBackend } from './src/services/api';

const Stack = createStackNavigator();

function App() {
  const { colors, isDark, statusBar } = useAppTheme();
  const { isAuthenticated, isLoading, setLoading, restoreSession, setSessionFromFirebase, syncWithBackendInBackground } = useUserStore();
  const { fetchTodayActivity } = useActivityStore();
  const { fetchNotifications } = useNotificationStore();
  const { loadSettings } = useSettingsStore();

  const paperTheme = useMemo(() => {
    const base = isDark ? MD3DarkTheme : MD3LightTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        surface: colors.surface,
        error: colors.error,
        onSurface: colors.text,
      },
    };
  }, [colors, isDark]);

  const navTheme = useMemo(() => {
    const base = isDark ? NavDark : NavLight;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
      },
    };
  }, [colors, isDark]);

  useEffect(() => {
    const SESSION_TIMEOUT_MS = 8000;

    const initializeApp = async () => {
      warmupBackend();
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
            try {
              await signOut(auth);
            } catch {
              // ignore
            }
          }
        }

        setLoading(false);

        await loadSettings();
        const stepGoal = useSettingsStore.getState().settings.stepGoal;
        usePedometerStore.getState().setDailyGoal(stepGoal);
        initializeNotifications();
        initializeStepCounter();
        if (useUserStore.getState().isAuthenticated) {
          fetchTodayActivity();
          usePedometerStore.getState().loadPersisted().then(() => {
            usePedometerStore.getState().initializeStepsForTheDay();
          });
          fetchNotifications();
          useNotesStore.getState().loadPlanner();
        }
      } catch (error) {
        console.warn('App init recovered:', error instanceof Error ? error.message : error);
        setLoading(false);
      }
    };

    initializeApp();
  }, [restoreSession, setSessionFromFirebase, setLoading, syncWithBackendInBackground, fetchTodayActivity, fetchNotifications, loadSettings]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <PaperProvider theme={paperTheme}>
          <NavigationContainer theme={navTheme}>
            <StatusBar barStyle={statusBar} backgroundColor={colors.background} />
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
                cardStyle: { backgroundColor: colors.background },
              }}
            >
              {isLoading ? (
                <Stack.Screen name="Loading" component={LoadingScreen} />
              ) : isAuthenticated ? (
                <Stack.Screen name="Main" component={MainNavigator} />
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
