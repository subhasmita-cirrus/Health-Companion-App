# HealthCompanion

Personal daily wellness tracker for one person on one phone: walk, log water, mood, short AI tips, study points and reminders.

**Full product + architecture (why, stack, keys, how to run):** [docs/APP_OVERVIEW.md](docs/APP_OVERVIEW.md)

| Doc | Contents |
| --- | --- |
| [docs/APP_OVERVIEW.md](docs/APP_OVERVIEW.md) | Why it exists, features, flow, logic, tech stack, **keys**, run steps |
| [backend/README.md](backend/README.md) | NestJS API, env vars, endpoints |
| [DEPLOY.md](DEPLOY.md) | Supabase + Render |
| [docs/README.md](docs/README.md) | Doc index |

---

## Why this project

Built as a **full-stack student / portfolio app**. Real phone features (steps, notifications, TTS) plus Firebase Auth, Firestore, a NestJS profile API, PostgreSQL (Supabase), and optional Gemini tips.

It is **not** a medical device and does not diagnose illness. No AWS / S3 / Amplify. Calories are `steps × 0.04` (not a food diary). Avatars are initials.

---

## What it is used for

| Need | Where |
| --- | --- |
| Count **real steps** | Activity → Start / Stop walk |
| Log **water** (confirm + undo) | Water tab, Home Add water |
| **Mood** check-in | Home faces → mood card |
| **Tips** | Tips → Get a personalized tip (Gemini or fallbacks) |
| **Study points** | Study notes — one line = one bullet |
| **Reminders** | Same screen — one line = one reminder, Once a day or All day |
| **Profile** | Profile edit → NestJS → Postgres |
| **Theme** | Light / Dark / System on Auth, Profile, Settings |

---

## Flow (short)

Splash → **Sign in / Sign up** (Firebase) → tabs **Home · Activity · Water · Tips · Profile** → **Study notes** and **Settings** on the stack.

```
Phone ── Firebase Auth
     ├── Firestore (daily logs, planner)
     ├── Gemini (optional tips)
     └── NestJS on Render ── PostgreSQL on Supabase (profile)
```

---

## Tech stack (what uses what)

| Piece | Used for |
| --- | --- |
| React Native 0.81, TypeScript, Zustand | App UI and state |
| React Navigation | Auth vs tabs vs Settings/Notes |
| Firebase Auth | Email / password login |
| Firestore + AsyncStorage | Daily steps/water and study planner |
| NestJS + TypeORM + PostgreSQL | User profile only |
| Render | Host the API (`GET /health`, `GET/PATCH /users/me`) |
| Native step counter | Real walking |
| Notifee | Water, test, study reminders |
| Gemini `gemini-3.6-flash` | Personalized tips (`x-goog-api-key`) |
| react-native-tts | Speak tips / water / mood |
| React Native Paper, SVG rings, chart-kit | UI |

Metro port in this repo: **8082**. Android New Architecture is **off** (Windows path limits).

---

## Keys (never commit real values)

| Key / file | Where |
| --- | --- |
| `android/app/google-services.json` | Firebase Android app `com.baymax` |
| `src/constants/localSecrets.ts` | Gemini key (copy from `localSecrets.example.ts`, gitignored) |
| `backend/.env` | `DATABASE_URL`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` |
| Render Environment | Same backend vars |

`AppConstants.FIREBASE_CONFIG` in `src/constants/index.ts` is **unused**. Firebase is native.

Live API URL: `PRODUCTION_API_BASE_URL` in `src/constants/index.ts` (currently `https://health-companion-app-yzhs.onrender.com`). Render **free** sleeps after ~15 minutes idle.

Details: [docs/APP_OVERVIEW.md](docs/APP_OVERVIEW.md) §6–7.

---

## How to run

### Prerequisites

- Node.js **20+**
- Android Studio + USB debugging (or emulator)
- Firebase project: Auth (email/password) + Firestore
- Optional: Gemini key, local Postgres

### Mobile

```bash
npm install
# put google-services.json in android/app/
npm start
```

(`npm start` = Metro on **8082**. `postinstall` reapplies the Oppo/accelerometer step-counter patch.)

**Emulator:** `npm run android`

**Physical phone (Windows).** Add `adb` to PATH if the command is not found:

```bat
set PATH=%LOCALAPPDATA%\Android\Sdk\platform-tools;%PATH%
adb reverse tcp:8082 tcp:8082
cd android
set GRADLE_USER_HOME=%USERPROFILE%\.gradle
gradlew.bat app:installDebug -x lint -PreactNativeDevServerPort=8082 -PreactNativeArchitectures=arm64-v8a
adb shell am start -n com.baymax/.MainActivity
```

Shake → **Reload** after JS changes. Debug builds need Metro.

**Release APK** (JS bundled, no Metro; sideload OK, signed with debug keystore):

```bat
npm run android:release
```

APK: `android\app\build\outputs\apk\release\app-release.apk`

```bat
set PATH=%LOCALAPPDATA%\Android\Sdk\platform-tools;%PATH%
adb install -r android\app\build\outputs\apk\release\app-release.apk
```

Activity → **Start walk**, then walk with the phone — the count rises per step (accelerometer), not on the button tap.

Gemini (optional): copy `src/constants/localSecrets.example.ts` to `localSecrets.ts` and paste the key.

### Backend (optional — app can use live Render)

```bash
cd backend
npm install
# create .env — see backend/README.md (there is no committed .env.example if gitignore blocks .env.*)
npm run start:dev
```

Then set `USE_LIVE_API_IN_DEV = false` in `src/constants/index.ts`.

---

## Project structure

```
App.tsx                 auth gate, theme, /health warmup
src/screens/            Auth, Home, Activity, Water, Tips, Profile, Settings, Notes
src/stores/             Zustand
src/services/           api.ts, firestoreSync.ts, ttsService.ts
src/constants/          URLs + gitignored localSecrets.ts
backend/                NestJS users API
docs/APP_OVERVIEW.md    full guide
```

---

## License

MIT — see LICENSE if present in the repository.
