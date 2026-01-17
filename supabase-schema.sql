-- Supabase Database Schema
-- Run this in Supabase SQL Editor

-- Create parents table
CREATE TABLE IF NOT EXISTS parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL UNIQUE,
  email TEXT,
  consent_version TEXT DEFAULT '1.0',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_child_id UUID,
  settings_json JSONB DEFAULT '{}'::jsonb
);

-- Create child_profiles table
CREATE TABLE IF NOT EXISTS child_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  avatar_id TEXT,
  age_band TEXT CHECK (age_band IN ('6-8', '9-11', '12-14')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ
);

-- Create child_data table (for sync)
CREATE TABLE IF NOT EXISTS child_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL UNIQUE REFERENCES child_profiles(id) ON DELETE CASCADE,
  state_blob JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1
);

-- Create events table (append-only for achievements)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_child_profiles_parent_id ON child_profiles(parent_id);
CREATE INDEX IF NOT EXISTS idx_parents_provider_user_id ON parents(provider_user_id);
CREATE INDEX IF NOT EXISTS idx_events_child_id ON events(child_id);
CREATE INDEX IF NOT EXISTS idx_events_event_id ON events(event_id);

-- Enable Row Level Security
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running)
DROP POLICY IF EXISTS "Parents can view own data" ON parents;
DROP POLICY IF EXISTS "Parents can update own data" ON parents;
DROP POLICY IF EXISTS "Parents can manage their children" ON child_profiles;
DROP POLICY IF EXISTS "Parents can access child data" ON child_data;
DROP POLICY IF EXISTS "Parents can access child events" ON events;

-- RLS Policies for parents
CREATE POLICY "Parents can view own data" ON parents
  FOR SELECT USING (auth.uid()::text = provider_user_id);

CREATE POLICY "Parents can update own data" ON parents
  FOR UPDATE USING (auth.uid()::text = provider_user_id);

CREATE POLICY "Parents can insert own data" ON parents
  FOR INSERT WITH CHECK (auth.uid()::text = provider_user_id);

-- RLS Policies for child_profiles
CREATE POLICY "Parents can manage their children" ON child_profiles
  FOR ALL USING (
    parent_id IN (
      SELECT id FROM parents WHERE provider_user_id = auth.uid()::text
    )
  );

-- RLS Policies for child_data
CREATE POLICY "Parents can access child data" ON child_data
  FOR ALL USING (
    child_id IN (
      SELECT id FROM child_profiles 
      WHERE parent_id IN (
        SELECT id FROM parents WHERE provider_user_id = auth.uid()::text
      )
    )
  );

-- RLS Policies for events
CREATE POLICY "Parents can access child events" ON events
  FOR ALL USING (
    child_id IN (
      SELECT id FROM child_profiles 
      WHERE parent_id IN (
        SELECT id FROM parents WHERE provider_user_id = auth.uid()::text
      )
    )
  );

-- Keep existing tables for backward compatibility (if migrating from Prisma)
-- These will be migrated later
CREATE TABLE IF NOT EXISTS words (
  id TEXT PRIMARY KEY,
  english_word TEXT NOT NULL,
  hebrew_translation TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT true,
  image_url TEXT,
  audio_url TEXT,
  example_en TEXT,
  example_he TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_plans (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(child_id, date)
);

CREATE TABLE IF NOT EXISTS daily_plan_words (
  id TEXT PRIMARY KEY,
  daily_plan_id TEXT NOT NULL,
  word_id TEXT NOT NULL,
  UNIQUE(daily_plan_id, word_id)
);

CREATE TABLE IF NOT EXISTS progress (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL,
  word_id TEXT NOT NULL,
  times_seen_in_learn INTEGER DEFAULT 0,
  quiz_attempts INTEGER DEFAULT 0,
  quiz_correct INTEGER DEFAULT 0,
  last_seen_at TIMESTAMPTZ,
  mastery_score INTEGER DEFAULT 0,
  needs_review BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(child_id, word_id)
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL,
  word_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  question_type TEXT NOT NULL,
  correct BOOLEAN NOT NULL,
  is_extra BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS mission_states (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL,
  period_type TEXT NOT NULL,
  mission_key TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  target INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  period_start_date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(child_id, period_type, mission_key, period_start_date)
);

CREATE TABLE IF NOT EXISTS level_states (
  id TEXT PRIMARY KEY,
  child_id TEXT UNIQUE NOT NULL,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
