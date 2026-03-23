-- ============================================================
-- 許氏族譜 / Xu Family Genealogy — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Drop table if re-running
DROP TABLE IF EXISTS family_members;

-- Main table
CREATE TABLE family_members (
  id          INTEGER PRIMARY KEY,
  line1       TEXT        NOT NULL,           -- person's name
  line2       TEXT,                           -- first spouse
  line3       TEXT,                           -- second spouse (optional)
  position    TEXT,                           -- generation label (一世, 二世 …)
  refs        INTEGER[]   DEFAULT '{}',       -- children IDs
  is_deceased BOOLEAN     NOT NULL DEFAULT FALSE,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_family_members_updated_at
  BEFORE UPDATE ON family_members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY "public read"
  ON family_members FOR SELECT
  USING (true);

-- Only authenticated users can write
-- (Application layer further restricts to AUTHORIZED_EDITORS)
CREATE POLICY "auth write"
  ON family_members FOR ALL
  USING (auth.role() = 'authenticated');
