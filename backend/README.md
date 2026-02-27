# Health Companion API (NestJS + TypeORM + PostgreSQL)

Backend for the Health Companion React Native app. Uses **Firebase Auth** for authentication and stores all user details in **PostgreSQL**.

## Setup

1. **Install dependencies**
   ```bash
   cd backend && npm install
   ```

2. **PostgreSQL**
   - **Local:** Create a database, e.g. `health_companion`. Tables are created automatically in development (`synchronize: true` when `NODE_ENV=development`).
   - **Supabase (production):** Use `DATABASE_URL` (see root `DEPLOY.md`). Run `backend/supabase-schema.sql` once in Supabase SQL Editor.

3. **Environment**
   - Copy `.env.example` to `.env` and fill in:
     - **Database:** either `DATABASE_URL` (Supabase URI) or `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`
     - Firebase Admin: either `GOOGLE_APPLICATION_CREDENTIALS` (path to service account JSON) or `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
   - Get Firebase service account: Firebase Console → Project Settings → Service Accounts → Generate new private key.

4. **Run**
   ```bash
   npm run start:dev
   ```
   API runs at `http://localhost:3000`.

## Auth flow

- Frontend signs in with **Firebase Auth** (email/password) and gets an ID token.
- Frontend calls API with `Authorization: Bearer <id_token>`.
- Backend verifies the token with **Firebase Admin**, then finds or creates the user in PostgreSQL and returns/saves profile.

## Endpoints

- `GET /` – health check
- `GET /users/me` – current user (create from Firebase if new). Requires `Authorization: Bearer <firebase_id_token>`.
- `PATCH /users/me` – update profile. Same auth.

## Frontend (React Native)

- Set `API_BASE_URL` in `src/constants/index.ts` (e.g. `http://10.0.2.2:3000` for Android emulator).
- Auth screen uses Firebase sign in / sign up and then calls `GET /users/me` with the token; user is stored in the app state and in the DB.
