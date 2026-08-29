# Health Companion API (NestJS + TypeORM + PostgreSQL)

Backend for the HealthCompanion React Native app.

- **This API stores the user profile** (name, email, height, weight, fitness).
- **Daily steps, water, mood, and study planner live on the phone** (AsyncStorage + Firestore), not in this API.

Full product guide: [docs/APP_OVERVIEW.md](../docs/APP_OVERVIEW.md). Deploy: [DEPLOY.md](../DEPLOY.md). There is **no AWS** in this project.

---

## Why NestJS exists here

Firebase already authenticates the user. NestJS is a small **profile service**: verify the Firebase ID token, then find-or-create a PostgreSQL row keyed by `firebase_uid`. That keeps structured profile fields in SQL while activity stays in Firestore.

---

## Setup

1. **Install**

   ```bash
   cd backend && npm install
   ```

2. **PostgreSQL**

   - **Local:** create a database such as `health_companion`. In development TypeORM `synchronize: true` can create tables.
   - **Supabase (production):** set `DATABASE_URL` (transaction **pooler**, port **6543**). Run `backend/supabase-schema.sql` once in the SQL Editor. See [DEPLOY.md](../DEPLOY.md).

3. **Environment** — create `backend/.env` (gitignored). Use these keys:

   | Variable | Used for |
   | --- | --- |
   | `DATABASE_URL` | Supabase/local Postgres URI (preferred) |
   | `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` | Local Postgres if you do not use `DATABASE_URL` |
   | `FIREBASE_PROJECT_ID` | Admin SDK project |
   | `FIREBASE_CLIENT_EMAIL` | Service account |
   | `FIREBASE_PRIVATE_KEY` | Service account private key (`\n` for newlines) |
   | `GOOGLE_APPLICATION_CREDENTIALS` | Optional path to service-account JSON instead of the three vars above |
   | `CORS_ORIGINS` | Optional; default `*` |
   | `PORT` | Optional; default `3000` (Render sets this) |
   | `NODE_ENV` | `development` enables schema sync |

   Firebase Admin JSON: Console → Project settings → Service accounts → Generate new private key. **Server only** — never put this JSON in the React Native app.

4. **Run**

   ```bash
   npm run start:dev
   ```

   | URL | What |
   | --- | --- |
   | http://localhost:3000/health | `{ "ok": true, "service": "health-companion-api" }` |
   | http://localhost:3000/api | Swagger |
   | http://localhost:3000/users/me | Profile (Bearer Firebase ID token) |

---

## Auth flow

1. App signs in with **Firebase Auth** (email/password).
2. App sends `Authorization: Bearer <id_token>`.
3. `FirebaseAuthGuard` verifies the token with **Firebase Admin**.
4. `GET /users/me` finds or creates the Postgres user.
5. `PATCH /users/me` updates profile fields.

The mobile app **does not wait** on this call at login (Render free tier can sleep ~15 minutes). Sync runs in the background.

---

## Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/health` | No | Liveness (also used by the app to wake Render) |
| `GET` | `/users/me` | Bearer Firebase token | Get or create profile |
| `PATCH` | `/users/me` | Bearer Firebase token | Update display name, height, weight, fitness, gender |

---

## Frontend

In `src/constants/index.ts`:

- `USE_LIVE_API_IN_DEV = true` → Render `PRODUCTION_API_BASE_URL`
- `false` → `DEV_API_BASE_URL` (`10.0.2.2:3000` emulator, or `http://<PC_IP>:3000` physical device)

Firebase on the phone is **`google-services.json`**, not this `.env`.
