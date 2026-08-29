# HealthCompanion — product, stack, flow, keys, how to run

Use this as the source of truth for demos, interviews, and setup.

| Doc | Purpose |
| --- | --- |
| [README](../README.md) | Short summary + run commands |
| [backend/README](../backend/README.md) | NestJS API, env vars, endpoints |
| [DEPLOY](../DEPLOY.md) | Supabase + Render production |

---

## 1. Why this project exists

HealthCompanion is a **software-engineering student / portfolio app**: a real mobile product that ties together a phone UI, cloud auth, a REST API, a SQL database, and optional AI.

**Problem it solves:** people forget to walk, drink water, and keep a simple record of the day. Typical fitness apps are heavy. This app is a **personal daily companion** — one user, one phone, today’s steps and water, short tips, and reminders.

**Why it was built this way**

- Practice a **full stack**: React Native + Firebase + NestJS + PostgreSQL + Firestore.
- Show **offline-friendly** daily logs (AsyncStorage) with optional cloud sync.
- Show **native device APIs** (step sensor, notifications, TTS).
- Show **optional AI** (Gemini) with a safe fallback if the key is missing.
- Stay **free-tier friendly** (Firebase, Render, Supabase, Gemini free quota).

It is **not** a medical device, clinic system, social network, or food calorie diary. It does not diagnose illness.

**One-line pitch:** A React Native wellness companion: Firebase login, live step counting, water logging with confirm/undo, mood check-in, Gemini tips with voice, study reminders, Firestore daily logs, and a NestJS/Postgres profile API — light and dark themes.

On the phone the name is **HealthCompanion**. Android package: `com.baymax`. Icon: teal heartbeat + heart.

---

## 2. What it is used for

| User goal | Where | What happens |
| --- | --- | --- |
| Stay active | **Activity** → Start walk | Real steps from the phone sensor |
| Stay hydrated | **Water** / Home **Add water** | Confirm you drank it, then add ml vs daily goal |
| Fix a mistaken log | **Water** → −ml / Undo last / Reset today | Decreases or clears today’s water (never below 0) |
| See progress | **Home**, **Activity** | Goal %, 7-day charts, period totals |
| Check in emotionally | Home **How are you feeling?** | Mood card + emoji; saved for today; used in AI tips |
| Get advice | **Tips** → Get a personalized tip | Gemini `gemini-3.6-flash` or built-in fallbacks |
| Hear the app | Listen / Speak status | `react-native-tts` if voice is on in Settings |
| Keep a profile | **Profile** edit | Name, height, weight, fitness → NestJS → PostgreSQL |
| Study / remember | **Study notes** | Bullet points (one line = one item) + optional Notifee reminders |
| Comfortable UI | Appearance | Light / Dark / System |

**Calories** = `round(steps × 0.04)`. No food log. Avatar is **initials** (no photo upload, no AWS/S3).

---

## 3. User flow

### 3.1 Screen map

```
Splash (LoadingScreen)
        │
        ▼
   Auth (sign in / sign up)     Firebase email + password
   Theme picker: Light / Dark / System
        │
        ▼
   Main tabs
   ├── Home       snapshot, mood card, add water, study, tip preview
   ├── Activity   start/stop walk, rings, 7-day charts
   ├── Water      +ml (confirm), −ml / undo / reset, speak status
   ├── Tips       generate AI tip, listen, mark as read
   └── Profile    appearance, edit profile, notes, settings, sign out
              ├── Study notes & reminders
              └── Settings: goals, hydration interval, TTS, test reminder
```

### 3.2 First-time path

1. Splash restores Firebase session (about **8s** timeout so splash cannot hang forever).
2. No session → **Auth**: sign up (name, email, password) or sign in.
3. Firebase succeeds immediately; **NestJS** `GET /users/me` syncs the Postgres user **in the background** (Render free tier may be asleep).
4. **Home** shows today’s steps, water, calories, mood, notes, tip preview.
5. Daily loop: walk → log water (confirm) → optional mood → optional tip → goals in Settings.

### 3.3 Demo path (~8 minutes)

1. Sign up or sign in.
2. Home: tap a mood face → card + voice. **Add water** → confirm **Yes, I drank it**.
3. Activity: **Start walk**, walk, **Stop walk**.
4. Water: +250 ml (confirm). Try **Undo last** or **Reset today**.
5. Tips: **Get a personalized tip** (AI badge if Gemini works). **Listen**.
6. Profile: Dark then Light. Settings → change step goal, **Send test reminder**.
7. Home → **Study notes**: add a few **lines** of study points and reminder points.
8. Save height/weight, **Sign out**, sign in again.

### 3.4 Auth gate (`App.tsx`)

```
isLoading?     → LoadingScreen
authenticated? → MainNavigator (tabs + Settings + Notes)
else           → AuthScreen
```

On launch the app pings `GET /health` on Render so a sleeping free instance can wake while you use the UI.

---

## 4. How the logic works

### 4.1 Authentication

1. Firebase Auth: email + password.
2. Client keeps a Firebase **ID token**.
3. NestJS `FirebaseAuthGuard` verifies the token with **Firebase Admin**.
4. `GET /users/me` finds or creates a row in PostgreSQL (`users.firebase_uid`).
5. `PATCH /users/me` updates display name, height, weight, fitness, gender.
6. Sign out clears Firebase + local user state.

If Render is down or sleeping, the app still opens from the Firebase session.

### 4.2 Steps

- **Start walk** asks Android activity-recognition permission and starts `@dongminyu/react-native-step-counter`.
- Steps come from the **sensor only** (no fake timer).
- **Stop walk** unsubscribes; the count freezes.
- Calories: `round(steps * 0.04)`.
- Permission denied or sitting still → count stays 0. Expected.

### 4.3 Water

- Quick add: 100 / 200 / 250 / 500 ml. Home shortcut is **200 ml**.
- **Popup:** “Are you drinking this?” → No cancels; Yes logs it.
- Undo: −100/−200/−250/−500, **Undo last**, **Reset today** (second confirm).
- Total is clamped at **0**.
- Ring = `intake / waterGoal` (default 2000 ml, changeable in Settings).
- Today’s water is written to AsyncStorage immediately. Firestore syncs in the **background** and must not freeze the Water screen.

### 4.4 Mood

Home **How are you feeling?** (😄 🙂 😐 🙁 😞):

- Shows a **mood card** (large emoji + short message) and may speak.
- Saved in AsyncStorage for **today** (`@health_today_mood`).
- Included in the Gemini tip prompt when you generate a tip.

### 4.5 Daily activity storage

| Layer | What | Why |
| --- | --- | --- |
| Zustand `activityStore` | Today + `dailyRecords` | UI |
| AsyncStorage `@health_daily_records` | Days on device | Offline / fast reopen |
| Firestore `users/{uid}/daily/{YYYY-MM-DD}` | Steps, water, calories, active minutes | Cloud history |

Home, Water, and Activity share `todayActivity`. Period chips (today / week / month / year) aggregate `dailyRecords`.

Activity load uses **local data first**, then Firestore (timeout ~4s, last 7 days). The UI is not blocked on cloud.

### 4.6 Two databases on purpose

| Store | Holds |
| --- | --- |
| **PostgreSQL** (NestJS / Supabase) | Who the user is: email, name, height, weight, fitness |
| **Firestore** | What they did: daily steps, water, calories; planner notes |

### 4.7 Goals, reminders, TTS, theme

Persisted in AsyncStorage (`userSettings`):

- Step goal: 5k / 8k / 10k / 12k
- Water goal: 1500–3000 ml
- Hydration interval: 30 min / 1 / 2 / 3 hours
- Push reminders on/off
- Speak health tips on/off
- Appearance: `light` \| `dark` \| `system`

**Theme:** `ThemePicker` on Auth, Profile, Settings. `useAppTheme()` + `src/theme/colors.ts`.

**Test reminder** (Notifee): one now, another ~1 minute later. Android 13+ needs notification permission.

TTS (`ttsService`) no-ops when voice is off.

### 4.8 Health tips

1. Opening Tips shows four **fallback** tips (hydration, walk, sleep, breathing). Titles stay unique (no duplicate cards).
2. **Get a personalized tip** calls Gemini REST `generateContent` with header `x-goog-api-key` (needed for newer `AQ.` keys).
3. Model: **`gemini-3.6-flash`** (fallback `gemini-3.5-flash`). Older 1.5 / 2.0 / 2.5 Flash models are retired.
4. Prompt includes today’s **steps, water, and mood**.
5. Missing key or API error → red message; fallbacks still listed.
6. **Listen** / **Mark as read** / **Stop speaking**.

Key lives in gitignored `src/constants/localSecrets.ts` (copy from `localSecrets.example.ts`).

### 4.9 Study notes and reminders

Home / Profile → **Study notes & reminders**. Like a notes app: **one line = one point**.

**Today’s study (checklist, no notifications)**

- Type each topic on its own line (`Enter` for the next point). Optional `•` / `-` / `1.` prefixes are stripped.
- **Add point(s)** saves each line as a numbered item with a checkbox.
- Tick done or delete one point. Stored in AsyncStorage + Firestore `users/{uid}/planner/current`.

**Important reminders (phone notifications)**

- Same: one line = one reminder. Then choose schedule for **all lines in that add**:
  - **Once a day** (default): pick an hour (8am–9pm chips). Repeats daily at that hour.
  - **All day** (opt-in): pings at **9am, 11am, 1pm, 3pm, 5pm, 7pm, 9pm** every day.
- All day is **off** unless you tap it. It does **not** apply to study notes.
- Bell pauses one reminder; **X** deletes it. Notifee; allow notifications on Android 13+.

### 4.10 Branding

- In-app: `src/assets/app-icon.png`
- Android launcher: `android/app/src/main/res/mipmap-*/ic_launcher.png`
- iOS: `ios/baymax/Images.xcassets/AppIcon.appiconset/`
- Display name: **HealthCompanion** (`android/.../values/strings.xml`)

---

## 5. Tech stack — what each piece is for

### Mobile

| Piece | What it is | Why it is used |
| --- | --- | --- |
| React Native CLI **0.81**, React **19**, TypeScript | Phone app | Native Android/iOS, typed UI |
| React Navigation | Stack + bottom tabs | Auth vs main, Settings/Notes on a stack |
| Zustand | Client state | Lightweight stores (user, activity, tips, notes, settings) |
| React Native Paper | Material UI | Buttons, theme, MD3 |
| `react-native-svg` + `ProgressRing` | Rings | Step/water progress |
| `react-native-chart-kit` | Charts | 7-day activity |
| Firebase Auth | Email/password | Identity without building a custom auth server |
| Cloud Firestore | Daily docs + planner | Sync across reinstalls (when online) |
| AsyncStorage | Local cache | Offline water/steps/settings/mood |
| NestJS client `src/services/api.ts` | HTTPS + Bearer token | Profile CRUD |
| `@dongminyu/react-native-step-counter` | Pedometer | Real walking, not a fake counter |
| Notifee | Local notifications | Water, test, study reminders |
| Gemini REST (`x-goog-api-key`) | AI tips | Personalized coaching; fallbacks if it fails |
| `react-native-tts` | Speech | Accessibility / “listen” |
| `react-native-linear-gradient` | Header look | Home hero |

Default Metro port in this repo: **8082** (`npm run android`) because **8081** is often taken (e.g. Apache).

Android **New Architecture is off** (`newArchEnabled=false`) so Windows long path / CMake builds do not fail.

### Backend (`backend/`)

| Piece | What it is | Why it is used |
| --- | --- | --- |
| NestJS 10 | REST API | Profile only — not a second copy of steps/water |
| Swagger | `/api` | Try `GET /users/me` with a Firebase token |
| TypeORM | ORM | `users` table |
| PostgreSQL / **Supabase** | SQL | Durable profile |
| Firebase Admin | Verify ID token | Same login as the app |
| **Render** | Host | Public HTTPS URL for the phone |

Health check: `GET /health` → `{ "ok": true, "service": "health-companion-api" }`.

### Data flow

```
Phone (React Native)
   │  Firebase Auth (email / password)
   │
   ├── Firestore ── daily activity, study planner
   │
   ├── Google Gemini ── personalized tips (optional key)
   │
   └── HTTPS  Authorization: Bearer <id_token>
              └── NestJS on Render
                    └── PostgreSQL on Supabase  (profile)
```

### Not used (do not list as features)

- AWS, Amplify, S3 — removed; no cloud photo upload
- Food / calorie diary — calories from steps only
- Live Gemini without a key — fallbacks still work
- Custom RN `FIREBASE_CONFIG` in `AppConstants` — **unused**; Firebase is native (`google-services.json`)

---

## 6. Keys and secrets

**Never commit real keys.** Do not paste them in chat.

| Secret | Where you get it | Where you put it | Used for |
| --- | --- | --- | --- |
| `google-services.json` | Firebase Console → Project settings → Android app (`com.baymax`) | `android/app/google-services.json` | Auth, Firestore, (FCM module present) |
| GoogleService-Info.plist | Firebase iOS app | `ios/` | iOS Firebase (if you ship iOS) |
| Gemini API key | [Google AI Studio](https://aistudio.google.com/apikey) (free tier / Flash) | Copy `src/constants/localSecrets.example.ts` → `localSecrets.ts` (`LOCAL_GEMINI_API_KEY`) | Personalized tips. Gitignored. |
| `DATABASE_URL` | Supabase → Database → Transaction pooler URI **port 6543** | `backend/.env` and Render Environment | NestJS ↔ Postgres |
| `FIREBASE_PROJECT_ID` | Service account JSON `project_id` | `backend/.env`, Render | Verify ID tokens |
| `FIREBASE_CLIENT_EMAIL` | JSON `client_email` | same | same |
| `FIREBASE_PRIVATE_KEY` | JSON `private_key` (keep `\n` as `\n`) | same | same |
| `CORS_ORIGINS` | (optional) | Render; default `*` | Browser/Swagger CORS |
| `PORT` | (optional) | Render sets this | Nest listen port |

**Firebase Admin JSON:** Console → Project settings → Service accounts → Generate new private key. Use that JSON only on the **server** (backend `.env` / Render). Do not put it in the React Native app.

**Gemini:** keys may start with `AQ.` (newer AI Studio format). The app sends `x-goog-api-key`. Models **gemini-2.0-flash** and **gemini-2.5-flash** are retired; the app uses **gemini-3.6-flash**.

**Render free tier:** after ~**15 minutes** idle the API **sleeps**. First request can take **30–60s**. Check: `https://<your-service>.onrender.com/health` — fast JSON = awake; long wait then JSON = was sleeping.

Current production API in `src/constants/index.ts`:

`PRODUCTION_API_BASE_URL` = `https://health-companion-app-yzhs.onrender.com`

`USE_LIVE_API_IN_DEV = true` means debug builds talk to Render, not `localhost:3000`.

---

## 7. How to run this project

### Prerequisites

- **Node.js 20+**
- **Android Studio** (SDK, platform tools). USB debugging on the phone.
- Optional: **Xcode** for iOS
- Firebase project with **Auth (Email/Password)** and **Firestore**
- Optional: Gemini key, local Postgres, or just the live Render API

### 7.1 Install

```bash
npm install
cd backend && npm install && cd ..
```

Place **`android/app/google-services.json`**.

Gemini (optional):

```bash
copy src\constants\localSecrets.example.ts src\constants\localSecrets.ts
```

Paste your key into `LOCAL_GEMINI_API_KEY`.

### 7.2 Metro (JS bundler)

Port **8082**:

```bash
npx react-native start --port 8082
```

Keep this terminal open. Debug APKs **need Metro** (or a release build).

### 7.3 Android — emulator

In `src/constants/index.ts`: `USE_PHYSICAL_DEVICE = false` (API `10.0.2.2:3000` if you use a local backend).

```bash
npm run android
```

(`react-native run-android --port 8082`)

### 7.4 Android — physical phone (Windows)

1. Same Wi-Fi as the PC **or** USB with `adb reverse`.
2. `adb devices` should list the phone (`device`, not `unauthorized`).
3. `USE_PHYSICAL_DEVICE = true` and `PC_IP` = PC **IPv4** from `ipconfig` (Wi-Fi adapter), only needed if the app talks to a **local** Nest server. With `USE_LIVE_API_IN_DEV = true`, profile API is Render; Metro still needs USB reverse.

```bat
adb reverse tcp:8082 tcp:8082

cd android
set GRADLE_USER_HOME=%USERPROFILE%\.gradle
gradlew.bat app:installDebug -x lint -PreactNativeDevServerPort=8082 -PreactNativeArchitectures=arm64-v8a

adb shell am start -n com.baymax/.MainActivity
```

If the JS UI looks old: shake the device → **Reload**.

### 7.5 Backend locally (optional)

```bash
cd backend
# create .env with DATABASE_URL + Firebase Admin vars (see backend/README.md)
npm run start:dev
```

API: `http://localhost:3000`  
Swagger: `http://localhost:3000/api`  
Health: `http://localhost:3000/health`

Set `USE_LIVE_API_IN_DEV = false` so the app uses `DEV_API_BASE_URL`.

### 7.6 iOS

```bash
npm run ios
```

Requires CocoaPods and a Firebase iOS app config.

### 7.7 Production API

See [DEPLOY.md](../DEPLOY.md). After deploy, set `PRODUCTION_API_BASE_URL` to the Render URL.

---

## 8. Project map

```
App.tsx                         auth gate, Paper + Navigation theme, warmup /health
src/screens/                    Auth, Loading, Home, Activity, Water, Tips, Profile, Settings, Notes
src/navigation/                 tabs + Settings + Notes stack
src/stores/                     user, activity, pedometer, settings, tips, notifications, notes
src/services/                   api.ts, firestoreSync.ts, ttsService.ts
src/theme/                      colors.ts, useAppTheme.ts
src/components/                 ProgressRing, WeeklyChart, ThemePicker
src/constants/                  URLs, goals; localSecrets.ts (gitignored Gemini key)
src/assets/app-icon.png
android/                        native app, google-services.json, launcher icons
backend/src/users/              GET/PATCH /users/me
backend/src/auth/               Firebase Admin guard
docs/APP_OVERVIEW.md            this file
```

---

## 9. Permissions

| Permission | Why |
| --- | --- |
| Physical activity / activity recognition | Live step counting |
| Notifications (Android 13+) | Hydration, test reminder, study reminders |
| Internet | Firebase, Render, Gemini |

Without activity or notification permission the app still opens; walk count and reminders will not work.

---

## 10. Known limits (honest)

| Limit | Effect |
| --- | --- |
| Render **free** sleep ~15 min | First API call after idle is slow; `/health` wakes it |
| Debug APK | Needs Metro running on the PC |
| Gemini quota / retired models | Tips fall back to built-in list; UI shows the error |
| Steps | Need **Start walk** + sensor + permission |
| Mood / water | Local first; cloud sync is best-effort |
