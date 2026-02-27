export const Colors = {
  primary: '#6200EE',
  accent: '#03DAC4',
  background: '#F5F5F5',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#CCCCCC',
  darkGray: '#888888',
  lightGray: '#EEEEEE',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FFC107',
  info: '#2196F3',
  gradientStart: '#4c669f',
  gradientEnd: '#3b5998',
  gradientMiddle: '#192f6a',
};

export const Typography = {
  fontFamily: 'System',
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.black,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: Colors.black,
  },
  h3: {
    fontSize: 18,
    fontWeight: '500' as const,
    color: Colors.black,
  },
  body: {
    fontSize: 16,
    color: Colors.darkGray,
  },
  small: {
    fontSize: 14,
    color: Colors.gray,
  },
};

// Physical device: set to true and set PC_IP to your computer's LAN IP (run `ipconfig`, use "IPv4 Address" under Wi-Fi — NOT "Default Gateway" which is often 192.168.1.1).
// Emulator: set to false to use 10.0.2.2 (Android) or localhost (iOS sim).
const USE_PHYSICAL_DEVICE = true;
const PC_IP = '192.168.31.91'; // Your PC's IPv4 (from ipconfig under Wi-Fi). Change if your network changes.

/** Local/dev API URL (used when __DEV__ is true). */
const DEV_API_BASE_URL = USE_PHYSICAL_DEVICE
  ? `http://${PC_IP}:3000`
  : 'http://10.0.2.2:3000';

/** Production API URL (Render). Replace with your deployed service URL, e.g. https://health-companion-api.onrender.com */
export const PRODUCTION_API_BASE_URL = 'https://health-companion-app-yzhs.onrender.com';

/** Set to true to use the live Render API in dev (no local backend needed). Set to false to use local backend. */
const USE_LIVE_API_IN_DEV = true;

export const API_BASE_URL = USE_LIVE_API_IN_DEV ? PRODUCTION_API_BASE_URL : DEV_API_BASE_URL;

export const AppConstants = {
  WATER_INTAKE_GOAL_ML: 2000,
  STEP_GOAL: 10000,
  NOTIFICATION_CHANNEL_ID: 'health_companion_channel',
  NOTIFICATION_CHANNEL_NAME: 'Health Companion Notifications',
  GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY',
  AWS_S3_BUCKET_URL: 'YOUR_AWS_S3_BUCKET_URL',
  API_BASE_URL,
  PRODUCTION_API_BASE_URL,
  FIREBASE_CONFIG: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_AUTH_DOMAIN',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_STORAGE_BUCKET',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId: 'YOUR_APP_ID',
    measurementId: 'YOUR_MEASUREMENT_ID',
  },
};



