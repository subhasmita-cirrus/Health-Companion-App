export const Colors = {
  primary: '#0F766E',
  primaryDark: '#115E59',
  primarySoft: '#CCFBF1',
  accent: '#14B8A6',
  background: '#F4F7F6',
  surface: '#FFFFFF',
  white: '#FFFFFF',
  black: '#0F172A',
  gray: '#94A3B8',
  darkGray: '#64748B',
  lightGray: '#E2E8F0',
  success: '#059669',
  error: '#DC2626',
  warning: '#D97706',
  info: '#0284C7',
  water: '#0284C7',
  steps: '#0F766E',
  calories: '#EA580C',
  gradientStart: '#0F766E',
  gradientMiddle: '#0D9488',
  gradientEnd: '#134E4A',
};

export const Radius = {
  sm: 10,
  md: 16,
  lg: 22,
  full: 999,
};

export const Shadow = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
};

export const Typography = {
  fontFamily: 'System',
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.black,
    letterSpacing: -0.4,
  },
  h2: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.black,
    letterSpacing: -0.2,
  },
  h3: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.black,
  },
  body: {
    fontSize: 15,
    color: Colors.darkGray,
    lineHeight: 22,
  },
  small: {
    fontSize: 13,
    color: Colors.gray,
    letterSpacing: 0.1,
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
  /** Set your Google AI Studio key for live Gemini tips; otherwise curated fallback tips are used. */
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



