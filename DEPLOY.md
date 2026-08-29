# Deploy: Supabase (DB) + Render (API)

This guide sets up **Supabase** for the PostgreSQL database and **Render** for running the NestJS API. Product overview: [docs/APP_OVERVIEW.md](docs/APP_OVERVIEW.md). There is **no AWS** in this project (Supabase hostnames may contain `aws-0`; that is Supabase’s cloud, not an S3/Amplify integration).

---

## 1. Supabase (Database)

1. Go to [supabase.com](https://supabase.com) and create a project (e.g. `health-companion`).
2. Wait for the project to finish provisioning.
3. **Create the `users` table**  
   In the Supabase Dashboard: **SQL Editor** → New query. Paste and run the contents of:
   ```text
   backend/supabase-schema.sql
   ```
4. **Get the connection string**  
   **Settings** → **Database**:
   - Under **Connection string**, choose **URI**.
   - Use the **Connection pooling** URI (port **6543**) for the API server.
   - Copy it; it looks like:
     ```text
     postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
     ```
   - Replace `[YOUR-PASSWORD]` with your database password. You’ll use this as `DATABASE_URL` on Render.

---

## 2. Render (API server)

1. Go to [render.com](https://render.com) and sign in (e.g. with GitHub).
2. **New** → **Blueprint**.
3. Connect the repo that contains this project and (if asked) point to the repo root where `render.yaml` lives.
4. Render will create a Web Service from `render.yaml` (e.g. `health-companion-api`). Before or after the first deploy, set **Environment** variables in the service’s **Environment** tab:

   | Key | Value |
   |-----|--------|
   | `DATABASE_URL` | Supabase **Transaction pooler** URI (port **6543**). Do not use the Direct connection host with a `postgres.xxxxx` username. |
   | `FIREBASE_PROJECT_ID` | Your Firebase project ID. |
   | `FIREBASE_CLIENT_EMAIL` | Firebase service account `client_email`. |
   | `FIREBASE_PRIVATE_KEY` | Full private key (paste as one line; use `\n` for newlines). |
   | `CORS_ORIGINS` | `*` for testing, or your app’s origins (e.g. `https://your-app.onrender.com`). |

   **Firebase:** Get these from Firebase Console → Project Settings → Service Accounts → Generate new private key. Use the JSON’s `project_id`, `client_email`, and `private_key` (escape newlines as `\n` in Render’s value).

5. Save. Render will build (e.g. `npm ci && npm run build` in `backend`) and start with `npm run start:prod`.
6. Note the service URL, e.g. `https://health-companion-api.onrender.com`.

---

## 3. App (React Native) – production API URL

- **Release builds** use the production API automatically: the app uses `PRODUCTION_API_BASE_URL` when not in `__DEV__`.
- In `src/constants/index.ts`, set `PRODUCTION_API_BASE_URL` to your Render URL if it’s different:
  ```ts
  export const PRODUCTION_API_BASE_URL = 'https://health-companion-api.onrender.com';
  ```
   Replace with your actual Render service URL if you used another name.

   This repo currently uses:

   ```ts
   export const PRODUCTION_API_BASE_URL = 'https://health-companion-app-yzhs.onrender.com';
   ```

   Debug builds use that URL when `USE_LIVE_API_IN_DEV` is `true`.

---

## 4. Optional: run backend locally with Supabase

To run the API on your machine but still use Supabase as the DB:

1. Create `backend/.env` (see [backend/README.md](backend/README.md) for the key list).
2. Set:
   - `DATABASE_URL` = same Supabase pooling URI as above.
   - Firebase Admin vars (or `GOOGLE_APPLICATION_CREDENTIALS` to a service account JSON path).
3. From `backend`: `npm run start:dev`.

---

## Summary

| What | Where |
|------|--------|
| Database | Supabase (PostgreSQL); table created via `backend/supabase-schema.sql`. |
| API server | Render (NestJS from `backend/`; `render.yaml` at repo root). |
| App in dev | `USE_LIVE_API_IN_DEV` in `src/constants/index.ts` (live Render or local Nest). |
| App in release | `PRODUCTION_API_BASE_URL` (Render URL). |
| Health check | `GET https://<service>.onrender.com/health` — slow first hit = free tier was **asleep** (~15 min idle). |

Set `DATABASE_URL` and Firebase env vars on Render; keep `PRODUCTION_API_BASE_URL` in sync with your Render service URL.

**Note:** On Render’s free tier, the service may spin down after inactivity; the first request after that can be slow until it wakes up.

---

## If Render logs: `tenant/user postgres.xxxxx not found`

The API process starts, then TypeORM cannot log in to Postgres, so the service exits with status 1. The phone URL times out.

This happens when `DATABASE_URL` uses the **pooler username** (`postgres.<project-ref>`) with the **wrong host**.

**Fix in Supabase**

1. Open the project (unpause it if the free project is paused).
2. **Settings → Database → Connection string**.
3. Method: **URI**. Type: **Transaction** (pooler), port **6543**.
4. Copy the URI. It must look like:
   ```text
   postgresql://postgres.<project-ref>:<PASSWORD>@aws-0-<region>.pooler.supabase.com:6543/postgres
   ```
   Host must contain `pooler.supabase.com`. User must be `postgres.<project-ref>` (same ref as in the dashboard).
5. If the password has `@`, `#`, `%`, or `/`, URL-encode it.
6. Paste into Render → **Environment** → `DATABASE_URL` (no quotes around the value).
7. **Manual Deploy** → Deploy latest (or save env so it restarts).

Do **not** mix:
- user `postgres.xxxxx` + host `db.xxxxx.supabase.co` (direct) → this exact error
- Direct URI (user `postgres`, host `db....supabase.co`) on Render unless you have IPv4 working; prefer the pooler for Render.

