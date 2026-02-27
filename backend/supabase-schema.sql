-- Run this ONCE in Supabase: Dashboard → SQL Editor → New query → paste all → Run.
-- Tables are NOT created automatically when using Render + Supabase; you must run this.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid VARCHAR(128) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  photo_url VARCHAR(512),
  date_of_birth DATE,
  gender VARCHAR(20),
  height DECIMAL(5,2),
  weight DECIMAL(5,2),
  fitness_level VARCHAR(20),
  goals TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS "UQ_users_firebase_uid" ON users (firebase_uid);

COMMENT ON TABLE users IS 'Health Companion app users; synced from Firebase Auth.';
