# Migration Status: New Authentication System

## ✅ Completed

1. **Architecture Design**: Created architecture document with Supabase + Next.js
2. **Supabase Setup**: Installed `@supabase/supabase-js` and `@supabase/ssr`
3. **New Components Created**:
   - `SignInForm.tsx` - Magic link + Google OIDC sign-in
   - `ParentGate.tsx` - Math question or type-a-word challenge
   - `ProfilePicker.tsx` - Child profile selection screen
   - `auth/callback/route.ts` - OAuth callback handler
4. **Infrastructure**:
   - `lib/supabase.ts` - Client-side Supabase client
   - `lib/supabase-server.ts` - Server-side Supabase client
   - `lib/auth-new.ts` - New auth helpers
   - `middleware.ts` - Session refresh middleware
5. **Documentation**:
   - `ARCHITECTURE.md` - System architecture
   - `MIGRATION_PLAN.md` - Migration phases
   - `SUPABASE_SETUP.md` - Supabase setup guide

## ⚠️ Next Steps Required

### 1. Set Up Supabase Project
Follow `SUPABASE_SETUP.md` to:
- Create Supabase project
- Get API keys
- Set up database schema
- Configure authentication providers

### 2. Update Environment Variables
Add to `.env`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Database Migration
You have two options:

**Option A: Use Supabase (Recommended)**
- Run SQL from `SUPABASE_SETUP.md` in Supabase SQL Editor
- Update `prisma/schema.prisma` to use PostgreSQL
- Run `npx prisma db push` to sync schema

**Option B: Keep Prisma + SQLite (For now)**
- Update `prisma/schema.prisma` with new schema (see `schema-new.prisma`)
- Run `npx prisma db push`
- Note: RLS won't work with SQLite, so you'll need to add manual checks

### 4. Update Pages
Replace old auth pages:
- `/parent` → Use `SignInForm` component
- `/` → Use `ProfilePicker` for child selection
- Add parent gate to protected routes

### 5. Update Components
- Replace `PINGate` with `SignInForm`
- Replace `ChildLoginScreen` with `ProfilePicker`
- Add `ParentGate` to parent-only routes
- Update all components to use new auth helpers

## 🔄 Migration Strategy

### Phase 1: Parallel Systems (Current)
- Old auth system still works
- New components exist but not integrated
- Test new system alongside old

### Phase 2: Gradual Migration
- Update one page at a time
- Test thoroughly
- Keep old system as fallback

### Phase 3: Complete Switch
- Remove old auth code
- Update all components
- Deploy

## 📝 Important Notes

1. **Breaking Changes**:
   - No more PIN login (replaced with parent gate)
   - Child profiles now use `nickname` instead of `name`
   - Age stored as `age_band` ('6-8', '9-11', '12-14') instead of exact age
   - Parent accounts linked to Supabase Auth users

2. **Data Migration**:
   - Existing `ParentAccount` → New `Parent` table
   - Existing `ChildProfile` → Update to use `nickname` and `age_band`
   - Need to migrate existing data

3. **Session Management**:
   - Sessions now managed by Supabase (HTTP-only cookies)
   - No more NextAuth sessions
   - CSRF protection via Supabase RLS

## 🚀 Quick Start (After Supabase Setup)

1. Update `.env` with Supabase credentials
2. Run database migrations
3. Update `app/parent/page.tsx` to use `SignInForm`
4. Update `app/page.tsx` to use `ProfilePicker`
5. Test authentication flows
6. Gradually update other components

## 🐛 Known Issues

- `ProfilePicker` needs to be updated to properly set active child
- Need to create migration script for existing data
- RLS policies need testing
- Offline sync not yet implemented

## 📚 Files Changed/Created

**New Files**:
- `lib/supabase.ts`
- `lib/supabase-server.ts`
- `lib/auth-new.ts`
- `middleware.ts`
- `components/auth/SignInForm.tsx`
- `components/auth/ParentGate.tsx`
- `components/auth/ProfilePicker.tsx`
- `app/auth/callback/route.ts`
- `prisma/schema-new.prisma`

**Documentation**:
- `ARCHITECTURE.md`
- `MIGRATION_PLAN.md`
- `SUPABASE_SETUP.md`
- `MIGRATION_STATUS.md` (this file)

**To Be Updated**:
- `app/parent/page.tsx`
- `app/page.tsx`
- `components/ParentPanel.tsx`
- `components/WelcomeScreen.tsx`
- All other components using old auth
