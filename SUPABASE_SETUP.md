# Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up / Sign in
3. Click "New Project"
4. Fill in:
   - Name: `english-vocab-app`
   - Database Password: (save this!)
   - Region: Choose closest to you
5. Wait for project to be created (~2 minutes)

## 2. Get API Keys

1. Go to Project Settings → API
2. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 3. Set Up Database Schema

Run this SQL in Supabase SQL Editor:

```sql
-- Create parents table
CREATE TABLE parents (
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
CREATE TABLE child_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  avatar_id TEXT,
  age_band TEXT CHECK (age_band IN ('6-8', '9-11', '12-14')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_child_profiles_parent_id ON child_profiles(parent_id);
CREATE INDEX idx_parents_provider_user_id ON parents(provider_user_id);

-- Enable Row Level Security
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Parents can view own data" ON parents
  FOR SELECT USING (auth.uid()::text = provider_user_id);

CREATE POLICY "Parents can update own data" ON parents
  FOR UPDATE USING (auth.uid()::text = provider_user_id);

CREATE POLICY "Parents can manage their children" ON child_profiles
  FOR ALL USING (
    parent_id IN (
      SELECT id FROM parents WHERE provider_user_id = auth.uid()::text
    )
  );
```

## 4. Configure Authentication

1. Go to Authentication → Providers
2. Enable:
   - **Email**: Enable "Enable Email provider"
   - **Google**: 
     - Enable "Enable Google provider"
     - Add your Google OAuth credentials (from Google Cloud Console)
     - Redirect URL: `https://your-project.supabase.co/auth/v1/callback`

## 5. Set Environment Variables

Add to `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 6. Update Redirect URLs

In Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `http://localhost:3000` (dev) or your production URL
- Redirect URLs: Add `http://localhost:3000/auth/callback`

## 7. Test

1. Run `npm run dev`
2. Go to `/parent`
3. Try magic link sign-in
4. Try Google sign-in
