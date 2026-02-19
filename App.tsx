/**
 * Health Companion App
 * A comprehensive mobile health assistant built with React Native
 *
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar, useColorScheme, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Stores
import { useUserStore } from './src/stores/userStore';
import { useActivityStore } from './src/stores/activityStore';
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
import { Colors, Typography } from './src/constants';

const Stack = createStackNavigator();

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const { isAuthenticated, isLoading, setLoading } = useUserStore();
  const { fetchTodayActivity } = useActivityStore();
  const { fetchNotifications } = useNotificationStore();
  const { loadSettings } = useSettingsStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize notifications
        await initializeNotifications();
        
        // Initialize step counter
        initializeStepCounter();
        
        // Load settings
        await loadSettings();
        
        // Fetch initial data if authenticated
        if (isAuthenticated) {
          await Promise.all([
            fetchTodayActivity(),
            fetchNotifications(),
          ]);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        // Done initializing – allow navigation to Auth or Main
        setLoading(false);
      }
    };

    initializeApp();
  }, [isAuthenticated, fetchTodayActivity, fetchNotifications, loadSettings, setLoading]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider>
          <NavigationContainer>
            <StatusBar
              barStyle={isDarkMode ? 'light-content' : 'dark-content'}
              backgroundColor={isDarkMode ? Colors.background : Colors.white}
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
