# HealthCompanion

Mobile daily wellness tracker. Walk, log water, see progress, get short health tips.

**Product + architecture (read this):** [docs/APP_OVERVIEW.md](docs/APP_OVERVIEW.md)

| Doc | Contents |
| --- | --- |
| [docs/APP_OVERVIEW.md](docs/APP_OVERVIEW.md) | What it is, use, flow, logic, tech stack |
| [backend/README.md](backend/README.md) | NestJS API |
| [DEPLOY.md](DEPLOY.md) | Supabase + Render |

---

## What it is

A **React Native CLI** app with a **NestJS** backend. One person uses it as a personal health companion: live steps from the phone sensor, water logging, goals, reminders, optional Gemini tips with voice, and **light / dark / system** themes.

It is not a medical device and does not diagnose illness.

## What it is used for

- Count **real steps** while you walk (Start / Stop walk)
- Log **water** toward a daily goal
- See **today’s snapshot** and **7-day charts**
- Set **mood**, **step/water goals**, and **hydration reminders**
- Switch **Light / Dark / System** appearance
- Get **health tips** (Gemini if a key is set, otherwise built-in fallbacks)
- Save **profile** (name, height, weight, fitness) to PostgreSQL

Calories are estimated as `steps × 0.04` (not a food diary). Avatars are initials. **AWS / S3 / Amplify are not used.**

## Flow (short)

Splash → Sign in / Sign up (Firebase) → tabs: **Home · Activity · Water · Tips · Profile** → Settings (goals, reminders, appearance). Theme can also be set on the login screen.

## Tech stack

| Layer | Stack |
| --- | --- |
| Mobile | React Native 0.81, TypeScript, Zustand, React Navigation |
| Auth | Firebase Auth (email/password) |
| Daily logs | Firestore + AsyncStorage |
| Profile API | NestJS, TypeORM, PostgreSQL (Supabase in production) |
| API host | Render |
| Steps | Native step counter |
| Notifications | Notifee |
| Tips | Gemini (`gemini-1.5-flash`) + local fallbacks |
| Voice | react-native-tts |
| UI | React Native Paper, chart-kit, SVG rings, light/dark/system theme |

---

## Getting started

### Prerequisites

- Node.js >= 20
- React Native CLI / Android Studio (Xcode for iOS)
- Firebase project (Auth + Firestore)
- Optional: Gemini API key for live tips
- Optional: local PostgreSQL, or use the deployed Render API

### Install and run (mobile)

```bash
npm install
npm start
# Android (this repo uses Metro port 8082)
npm run android
```

Place `google-services.json` under `android/app/`. Firebase is configured natively, not via a root `.env`.

API base URL: `src/constants/index.ts` (`USE_LIVE_API_IN_DEV` / `PRODUCTION_API_BASE_URL`).

### Backend

```bash
cd backend
npm install
# copy .env.example → .env
npm run start:dev
```

See [backend/README.md](backend/README.md).

---

## Project structure

```
App.tsx
src/
  screens/          Auth, Loading, Home, Activity, Water, Tips, Profile, Settings
  navigation/       tabs + Settings stack
  stores/           Zustand
  services/         NestJS client, Firestore sync, TTS
  theme/            light/dark palettes, useAppTheme
  components/       ProgressRing, WeeklyChart, ThemePicker
  assets/           in-app logo
android/            launcher icons
backend/           NestJS + TypeORM users API
docs/               APP_OVERVIEW.md
```

---

## License

MIT — see LICENSE if present in the repository.
