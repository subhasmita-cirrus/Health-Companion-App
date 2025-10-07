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
    fontWeight: 'bold',
    color: Colors.black,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  h3: {
    fontSize: 18,
    fontWeight: '500',
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

export const AppConstants = {
  WATER_INTAKE_GOAL_ML: 2000,
  STEP_GOAL: 10000,
  NOTIFICATION_CHANNEL_ID: 'health_companion_channel',
  NOTIFICATION_CHANNEL_NAME: 'Health Companion Notifications',
  GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY',
  AWS_S3_BUCKET_URL: 'YOUR_AWS_S3_BUCKET_URL',
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



