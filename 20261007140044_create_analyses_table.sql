/*
# Create analyses table for CyberSafe

1. New Tables
- `analyses` — stores URL analysis results per authenticated user
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users, cascade delete)
  - `url` (text, not null) — the submitted URL text
  - `verdict` (text, not null) — one of 'SAFE', 'REVIEW', 'SUSPICIOUS'
  - `hostname` (text) — parsed hostname from the URL
  - `evidence` (jsonb) — array of evidence items triggered by the analysis
  - `created_at` (timestamptz, default now())
2. Security
- Enable RLS on `analyses`.
- Owner-scoped CRUD: each authenticated user can only access rows they own.
- 4 separate policies: SELECT, INSERT, UPDATE, DELETE, all scoped to authenticated with auth.uid() = user_id.
3. Indexes
- Index on user_id for fast per-user lookups.
- Index on created_at desc for recent-analyses ordering.
*/

CREATE TABLE IF NOT EXISTS analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  url text NOT NULL,
  verdict text NOT NULL CHECK (verdict IN ('SAFE', 'REVIEW', 'SUSPICIOUS')),
  hostname text,
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_analyses" ON analyses;
CREATE POLICY "select_own_analyses"
ON analyses FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_analyses" ON analyses;
CREATE POLICY "insert_own_analyses"
ON analyses FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_analyses" ON analyses;
CREATE POLICY "update_own_analyses"
ON analyses FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_analyses" ON analyses;
CREATE POLICY "delete_own_analyses"
ON analyses FOR DELETE
TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
