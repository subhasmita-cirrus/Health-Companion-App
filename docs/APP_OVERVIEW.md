# HealthCompanion — what it is, how to use it, how it works

Product and architecture guide. Use this to demo, test, or explain the project.

Other docs: [README](../README.md) · [backend/README](../backend/README.md) · [DEPLOY](../DEPLOY.md)

---

## 1. What is the app?

**HealthCompanion** is a personal daily wellness tracker: a **React Native CLI** phone app plus a **NestJS** API.

It helps one person walk more, drink enough water, see progress, and get short health tips. It is **not** a medical device, clinic app, or social network. It does not diagnose illness.

On the home screen the name is **HealthCompanion**. The icon is a teal mark with a heartbeat line and a heart.

**One-line pitch:** “A React Native health companion: Firebase login, live step counting, water logging, goals and reminders, Gemini tips with voice, Firestore daily logs, and a NestJS/Postgres profile API — with light and dark themes.”

---

## 2. What is it used for?

| Goal | What the user does | What the app does |
| --- | --- | --- |
| Stay active | **Start walk**, walk with the phone, **Stop walk** | Counts **real** steps from the device sensor |
| Stay hydrated | Tap +100 / +200 / +250 / +500 ml | Adds to today’s total vs a water goal |
| See progress | Open Home and Activity | % of goals, 7-day charts, period totals |
| Feel accountable | Mood chips, goals, reminders | Saves mood; optional hydration notifications |
| Get advice | **Get a personalized tip**, **Listen** | Gemini (or built-in fallback) + TTS |
| Keep a profile | Edit name, height, weight, fitness | Saved to PostgreSQL via NestJS |
| Comfortable UI | **Appearance**: Light / Dark / System | Theme saved on device, applied app-wide |

**Calories** = `round(steps × 0.04)`. There is no food diary. Profile photo is an **initials** circle (no image upload).

---

## 3. User flow

### 3.1 Screens

```
Splash (Loading)
        │
        ▼
   Sign in / Sign up  ── Firebase email + password
   (Appearance: Light / Dark / System)
        │
        ▼
   Main tabs
   ├── Home      snapshot, mood, quick actions
   ├── Activity  start/stop walk, rings, 7-day charts
   ├── Water     log glasses, speak status
   ├── Tips      generate / listen / mark as read
   └── Profile   appearance, edit profile, sign out
              └── Settings: goals, reminders, appearance
```

### 3.2 First-time path

1. Splash while Firebase session is restored (~8s timeout).
2. No session → **Auth**: sign up (name, email, password) or sign in. Theme can be set here too.
3. App calls `GET /users/me` with the Firebase ID token; NestJS creates or loads the Postgres user.
4. **Home** shows today’s steps, water, calories, mood, tip preview.
5. Daily loop: walk on Activity → log water → optional tip → change goals/theme in Profile or Settings.

### 3.3 Demo path (~8 minutes)

1. Sign up / sign in.
2. Home: mood + **Add water**.
3. Activity: **Start walk**, walk, **Stop walk**.
4. Water: +250 ml, **Speak status**.
5. Tips: generate + **Listen**.
6. Profile: **Dark** then **Light**; **Goals & reminders** → change step goal, **Send test reminder**.
7. Save height/weight, **Sign out**, sign in again.

### 3.4 Auth gate (`App.tsx`)

```
isLoading?     → LoadingScreen
authenticated? → MainNavigator (tabs + Settings)
else           → AuthScreen
```

---

## 4. Logic

### 4.1 Authentication

1. Firebase Auth: `signInWithEmailAndPassword` / `createUserWithEmailAndPassword`.
2. Client sends `Authorization: Bearer <id_token>` to NestJS.
3. Firebase Admin verifies the token; user is **found or created** in PostgreSQL (`users.firebase_uid`).
4. `PATCH /users/me` updates name, height, weight, fitness level.
5. Sign out clears Firebase session and local user state.

If the API is slow or down, the app can still open from the Firebase session so splash does not hang forever.

### 4.2 Steps

- **Start walk** requests Android physical-activity permission and starts `@dongminyu/react-native-step-counter`.
- Steps come from the **sensor only** (no fake demo timer).
- **Stop walk** unsubscribes; the count freezes.
- Calories: `round(steps * 0.04)`.
- Shown on Activity (ring vs goal) and Home.

Permission denied or sitting still → count stays 0. Expected.

### 4.3 Water

- Quick add: 100, 200, 250, 500 ml. Home shortcut adds 200 ml.
- Stored on today’s activity record.
- Ring = `intake / waterGoal` (default 2000 ml).
- TTS if **Speak health tips** is on.

### 4.4 Daily activity storage

| Layer | What | Why |
| --- | --- | --- |
| Zustand `activityStore` | Today + `dailyRecords` | UI |
| AsyncStorage `@health_daily_records` | Days on device | Offline / fast reopen |
| Firestore `users/{uid}/daily/{YYYY-MM-DD}` | Steps, water, calories, active minutes | Cloud history (~30 days) |

Home, Water, and Activity share `todayActivity`. Period chips (today / week / month / year) aggregate `dailyRecords`.

### 4.5 Two stores on purpose

| Store | Holds |
| --- | --- |
| **PostgreSQL** (NestJS / Supabase) | Who the user is: email, name, height, weight, fitness |
| **Firestore** | What they did: daily steps, water, calories, mood |

### 4.6 Goals, reminders, TTS, theme

Persisted in AsyncStorage (`userSettings`):

- Step goal: 5k / 8k / 10k / 12k
- Water goal: 1500–3000 ml
- Hydration interval: 30 min / 1 / 2 / 3 hours
- Push reminders on/off
- Speak health tips on/off
- Appearance: `light` | `dark` | `system`

**Theme:** `ThemePicker` on Auth, Profile, and Settings. `useAppTheme()` reads the preference and the OS color scheme (`src/theme/colors.ts` palettes). Paper, navigation, tab bar, charts, and screens all use that palette.

**Test reminder** (Notifee): one notification now, another ~1 minute later. Android 13+ needs notification permission.

TTS (`ttsService`) does nothing when voice is off.

### 4.7 Health tips

1. Tips screen loads curated fallbacks (hydration, walk, sleep, breathing).
2. **Get a personalized tip** calls **Gemini 1.5 Flash** with today’s steps + water if `GEMINI_API_KEY` is a real key (`src/constants/index.ts`).
3. Placeholder key or API failure → fallback tip still appears.
4. **Listen** / **Mark as read** / **Stop speaking**.

### 4.8 Mood

Home chips `excellent` … `terrible` write onto today’s activity. Check-in only, not a clinical score.

### 4.9 Branding

- In-app: `src/assets/app-icon.png`
- Android launcher: `android/app/src/main/res/mipmap-*/ic_launcher.png` (+ round)
- iOS: `ios/baymax/Images.xcassets/AppIcon.appiconset/`
- Display name: **HealthCompanion** (`android/.../strings.xml`, `app.json`)

---

## 5. Tech stack

### Mobile

| Area | Choice |
| --- | --- |
| App | React Native CLI **0.81**, React **19**, TypeScript |
| Navigation | React Navigation (stack + bottom tabs) |
| State | Zustand |
| UI | React Native Paper, vector icons, linear gradient, SVG rings, chart-kit |
| Theme | Light / Dark / System (`src/theme/`) |
| Auth | Firebase Auth (email/password) |
| Daily data | Cloud Firestore + AsyncStorage |
| Profile API | Fetch → NestJS (`src/services/api.ts`) |
| Steps | `@dongminyu/react-native-step-counter` |
| Notifications | Notifee (FCM module is in the project) |
| AI tips | `@google/generative-ai` (Gemini) + local fallbacks |
| Voice | `react-native-tts` |

Default Android Metro port in this repo: **8082** (`npm run android`).

### Backend (`backend/`)

| Area | Choice |
| --- | --- |
| API | NestJS 10, Swagger |
| ORM | TypeORM |
| Database | PostgreSQL (local or **Supabase**) |
| Auth | Firebase Admin (verify ID token) |
| Hosting | **Render** — see `DEPLOY.md` |

### Data flow

```
Phone (React Native)
   │  Firebase Auth
   │
   ├── Firestore ──────── daily activity
   │
   └── HTTPS Bearer token ──► NestJS (Render)
                                  │
                                  └── PostgreSQL (Supabase)  profile
```

### Not used (do not list these as features)

- **AWS, Amplify, S3** — packages removed; no cloud photo upload
- Food / calorie diary — calories are from steps only
- Live Gemini without a key — fallbacks still work
- Dark theme as OS-only — user can also force Light or Dark

---

## 6. Project map

```
App.tsx                         auth gate, Paper + Navigation theme
src/screens/                    Auth, Loading, Home, Activity, Water, Tips, Profile, Settings
src/navigation/                 tabs + Settings stack
src/stores/                     user, activity, pedometer, settings, tips, notifications
src/services/                   api.ts, firestoreSync.ts, ttsService.ts
src/theme/                      colors.ts, useAppTheme.ts
src/components/                 ProgressRing, WeeklyChart, ThemePicker
src/assets/app-icon.png         in-app logo
android/.../res/mipmap-*        launcher icons
backend/src/users/              GET/PATCH /users/me
docs/APP_OVERVIEW.md            this file
DEPLOY.md                       Supabase + Render
backend/README.md               API setup
```

---

## 7. Permissions

- **Physical activity** — live step counting
- **Notifications** — hydration / test reminders (Android 13+)

Without them the app still opens; walk count and reminders will not work.
