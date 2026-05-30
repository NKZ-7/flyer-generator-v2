-- ── cards table ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  signoff         TEXT NOT NULL,
  occasion        TEXT,
  vibe            TEXT,
  typography_id   TEXT,
  theme_id        TEXT,
  layout_id       TEXT,
  focal_motif     TEXT,
  image_url       TEXT,
  user_description TEXT
);

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own cards
CREATE POLICY "auth_insert" ON cards
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Authenticated users can read only their own cards
CREATE POLICY "auth_select_own" ON cards
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ── Storage bucket ────────────────────────────────────────────────────────────
-- Run this in the Supabase SQL editor OR via the dashboard Storage section:
-- Bucket name: card-images  |  Public: yes

INSERT INTO storage.buckets (id, name, public)
VALUES ('card-images', 'card-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read on card-images
CREATE POLICY "public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'card-images');

-- Allow service role to insert (uploads from server use service role key)
CREATE POLICY "service_insert" ON storage.objects
  FOR INSERT TO service_role
  WITH CHECK (bucket_id = 'card-images');

CREATE POLICY "service_upsert" ON storage.objects
  FOR UPDATE TO service_role
  USING (bucket_id = 'card-images');
