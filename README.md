# HealthCompanion - Mobile Health Assistant

A comprehensive mobile health assistant built with React Native that helps users track daily wellness activities and receive AI-driven health tips.

## 🚀 Features

### 👤 User Authentication & Profiles
- Firebase Authentication for secure login
- AWS S3 for profile image storage
- User profile management

### 📊 Activity Tracking
- Step counter with real-time tracking
- Water intake monitoring with daily progress visualization
- Calorie and active minutes tracking
- Weekly activity summaries

### 🔔 Smart Reminders & Notifications
- Push notifications via Firebase Cloud Messaging (Notifee)
- Hydration reminders
- Fitness goal notifications
- Customizable reminder settings

### 🧠 AI-Powered Health Tips
- Integrated Gemini API for personalized health suggestions
- Text-to-Speech engine for voice-based delivery
- Category-based tip organization
- Real-time tip generation

### ⚡ Real-time Data Sync
- Firestore for instant updates across devices
- PostgreSQL for long-term user history and analytics
- Offline support with data synchronization

### 🎨 Intuitive UI
- Beautiful, modern design with smooth animations
- Zustand for efficient state management
- Responsive and engaging user experience
- Dark/Light theme support

## 🛠 Tech Stack

- **Frontend**: React Native CLI
- **State Management**: Zustand
- **Authentication**: Firebase Authentication
- **Database**: Firestore + PostgreSQL
- **Notifications**: Firebase Cloud Messaging (Notifee)
- **Storage**: AWS S3 (Free Tier)
- **AI**: Gemini API
- **Text-to-Speech**: React Native TTS
- **UI Components**: React Native Paper
- **Charts**: React Native Chart Kit
- **Navigation**: React Navigation v6

## 📱 Screenshots

The app features a beautiful, modern UI with:
- Gradient backgrounds and smooth animations
- Progress rings for activity tracking
- Interactive charts for data visualization
- Card-based layout for better organization
- Intuitive navigation with bottom tabs

## 🚀 Getting Started

### Prerequisites

- Node.js (>= 20.19.4)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development)
- Firebase project
- AWS account (for S3 storage)
- Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd health-companion-app/baymax
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **iOS Setup** (if developing for iOS)
   ```bash
   cd ios && pod install && cd ..
   ```

4. **Firebase Setup**
   - Create a Firebase project
   - Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
   - Place them in the appropriate directories
   - Update Firebase configuration in `src/services/firebase.ts`

5. **Environment Variables**
   Create a `.env` file in the root directory:
   ```
   FIREBASE_API_KEY=your-firebase-api-key
   FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   FIREBASE_APP_ID=your-app-id
   GEMINI_API_KEY=your-gemini-api-key
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   AWS_S3_BUCKET=your-bucket-name
   ```

6. **Run the app**
   ```bash
   # Android
   npm run android
   
   # iOS
   npm run ios
   ```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── ProgressRing.tsx
│   └── StatCard.tsx
├── screens/            # App screens
│   ├── AuthScreen.tsx
│   ├── HomeScreen.tsx
│   ├── ActivityScreen.tsx
│   ├── TipsScreen.tsx
│   ├── ProfileScreen.tsx
│   └── ...
├── navigation/         # Navigation configuration
│   └── MainTabNavigator.tsx
├── stores/            # Zustand stores
│   ├── userStore.ts
│   ├── activityStore.ts
│   ├── settingsStore.ts
│   ├── notificationStore.ts
│   └── tipsStore.ts
├── services/          # External services
│   └── firebase.ts
├── types/             # TypeScript type definitions
│   └── index.ts
├── constants/         # App constants and themes
│   └── index.ts
└── utils/            # Utility functions
```

## 🔧 Configuration

### Firebase Setup
1. Enable Authentication (Email/Password)
2. Create Firestore database
3. Enable Cloud Messaging
4. Configure security rules

### AWS S3 Setup
1. Create S3 bucket
2. Configure CORS policy
3. Set up IAM user with appropriate permissions

### Gemini API Setup
1. Get API key from Google AI Studio
2. Enable Gemini API
3. Configure API limits and usage

## 📊 Features in Detail

### Activity Tracking
- **Step Counter**: Real-time step tracking with pedometer integration
- **Water Intake**: Easy water logging with preset amounts and custom input
- **Progress Visualization**: Beautiful progress rings and charts
- **Goal Setting**: Customizable daily goals for all activities

### Health Tips
- **AI Generation**: Personalized tips based on user activity
- **Categories**: Organized by fitness, nutrition, wellness, mental health
- **Voice Delivery**: Text-to-speech for accessibility
- **Scheduling**: Customizable tip delivery times

### Notifications
- **Smart Reminders**: Context-aware hydration and fitness reminders
- **Achievement Alerts**: Celebrate goal completions
- **Customizable**: Full control over notification types and timing

## 🎨 Design System

The app uses a comprehensive design system with:
- **Colors**: Primary, secondary, accent colors with dark/light variants
- **Typography**: Consistent font sizes and weights
- **Spacing**: Standardized spacing scale
- **Components**: Reusable UI components with consistent styling
- **Animations**: Smooth transitions and micro-interactions

## 🚀 Deployment

### Android
1. Generate signed APK
2. Upload to Google Play Store
3. Configure app signing

### iOS
1. Archive the app
2. Upload to App Store Connect
3. Submit for review

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- React Native community
- Firebase team
- Google AI (Gemini)
- AWS for cloud services
- All open-source contributors

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**HealthCompanion** - Your Personal Health Assistant 🏥💪