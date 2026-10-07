/*
# Create user_profiles table

## Purpose
Stores optional display name and preferences for each CyberSafe user.
Extends Supabase Auth's built-in auth.users table — does NOT replace it.

## New Tables
- `user_profiles`
  - `id` (uuid, primary key, references auth.users.id, cascade delete) — matches the auth user
  - `display_name` (text, nullable) — optional friendly name shown in the UI
  - `save_history` (boolean, default false) — whether the user has opted in to saving analysis history
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now()) — tracks profile modifications

## Security
- Enable RLS on `user_profiles`.
- Owner-scoped CRUD: each authenticated user can only access their own profile row.
- 4 separate policies: SELECT, INSERT, UPDATE, DELETE — all scoped to authenticated with auth.uid() = id.
- No anon access — profiles are private to the authenticated user.

## Important Notes
1. The `id` column defaults to `auth.uid()` so a user can insert their own profile without passing an id.
2. `save_history` defaults to false — analysis saving is opt-in by default.
3. No service-role keys are needed in frontend code; all access goes through the anon key with RLS.
*/
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  save_history boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON user_profiles;
CREATE POLICY "select_own_profile"
ON user_profiles FOR SELECT
TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON user_profiles;
CREATE POLICY "insert_own_profile"
ON user_profiles FOR INSERT
TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
CREATE POLICY "update_own_profile"
ON user_profiles FOR UPDATE
TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON user_profiles;
CREATE POLICY "delete_own_profile"
ON user_profiles FOR DELETE
TO authenticated USING (auth.uid() = id);
