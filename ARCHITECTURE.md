# Architecture: Privacy-First Kids App Authentication

## Tech Stack
- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + RLS + Storage)
- **Auth**: Supabase Auth (Magic Link + Google OIDC)
- **Session**: HTTP-only Secure cookies (handled by Supabase)
- **Offline**: IndexedDB for local cache + background sync
- **CSRF**: Next.js built-in CSRF protection + Supabase RLS

## Database Schema (Supabase/PostgreSQL)

### Parent Table
```sql
CREATE TABLE parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_provider TEXT NOT NULL, -- 'email' or 'google'
  provider_user_id TEXT NOT NULL, -- Supabase auth user ID
  email TEXT, -- Optional, from auth provider
  consent_version TEXT DEFAULT '1.0',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(auth_provider, provider_user_id)
);
```

### ChildProfile Table
```sql
CREATE TABLE child_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL, -- Pseudonymous nickname
  avatar_id TEXT, -- Avatar identifier (emoji or image ID)
  age_band TEXT CHECK (age_band IN ('6-8', '9-11', '12-14')), -- Age band instead of exact DOB
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ
);
```

### ChildData Table (for sync)
```sql
CREATE TABLE child_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  state_blob JSONB, -- Structured state data
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  UNIQUE(child_id)
);
```

### Events Table (append-only)
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL, -- Client-generated unique ID for deduplication
  type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id)
);
```

## Row Level Security (RLS) Rules

```sql
-- Parents can only see their own data
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parents can view own data" ON parents
  FOR SELECT USING (auth.uid()::text = provider_user_id);

-- Children belong to parents
ALTER TABLE child_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parents can manage their children" ON child_profiles
  FOR ALL USING (
    parent_id IN (SELECT id FROM parents WHERE provider_user_id = auth.uid()::text)
  );

-- Child data access
ALTER TABLE child_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parents can access child data" ON child_data
  FOR ALL USING (
    child_id IN (
      SELECT id FROM child_profiles 
      WHERE parent_id IN (
        SELECT id FROM parents WHERE provider_user_id = auth.uid()::text
      )
    )
  );
```

## Authentication Flow

1. **Parent Sign-In**:
   - Option 1: Email Magic Link (Supabase Auth)
   - Option 2: Google OIDC (Supabase Auth)
   - Session stored in HTTP-only secure cookie (Supabase handles this)

2. **First Run**:
   - Parent signs in → redirected to `/parent/setup`
   - Create 1+ child profiles (nickname + avatar + age_band)
   - Redirect to profile picker

3. **Child Mode Entry**:
   - Profile picker shows avatars
   - Child selects profile → enters "child mode"
   - Active child stored in session/cookie

4. **Parent Gate**:
   - Math question OR type-a-word challenge
   - Required for: settings, purchases, account management, external links

## Sync Strategy

- **Online**: Direct Supabase queries with RLS
- **Offline**: IndexedDB cache + background sync queue
- **Conflict Resolution**: 
  - Simple state: last-write-wins (version field)
  - Events: append-only with deduplication by event_id

## Threat Model Mitigations

1. **XSS**: React escapes by default, CSP headers
2. **CSRF**: Next.js CSRF tokens + Supabase RLS
3. **Session Theft**: HTTP-only cookies, Secure flag, SameSite
4. **Data Leakage**: RLS ensures parent/child isolation
