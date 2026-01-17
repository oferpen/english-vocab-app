# Simplified Authentication System

## Overview
The authentication system has been simplified to:
- **Google OAuth only** (no magic link, no PIN, no parent gate)
- **Direct child profile** (each Google account = one child profile)
- **No parent/child separation** (removed parent panel complexity)

## What Changed

### 1. Database Schema
Run `supabase-schema-simple.sql` in Supabase SQL Editor to add `provider_user_id` column to `child_profiles`.

### 2. Authentication Flow
1. User clicks "התחבר עם Google" on home page
2. Completes Google OAuth
3. Callback creates/updates child profile linked to Google user
4. Redirects to home page showing child's welcome screen

### 3. Components
- **SimpleSignIn**: Just Google login button
- **Removed**: SignInForm, ParentGate, ProfilePicker, ParentPanelNew

### 4. Pages
- **Home (`/`)**: Shows SimpleSignIn if not logged in, WelcomeScreen if logged in
- **Parent (`/parent`)**: Redirects to home

## Setup Steps

1. **Run SQL migration**:
   ```sql
   -- Copy contents of supabase-schema-simple.sql
   -- Run in Supabase SQL Editor
   ```

2. **Test**:
   - Go to `http://localhost:3000`
   - Click "התחבר עם Google"
   - Complete OAuth flow
   - Should see welcome screen with child's name

## Files Changed
- `app/page.tsx` - Simplified to use SimpleSignIn
- `app/auth/callback/route.ts` - Creates child profile directly
- `app/parent/page.tsx` - Redirects to home
- `components/auth/SimpleSignIn.tsx` - New simple sign-in component
- `lib/auth-simple.ts` - New simplified auth helper

## Removed Complexity
- ❌ Magic link authentication
- ❌ PIN-based login
- ❌ Parent gate (math question)
- ❌ Profile picker
- ❌ Parent panel
- ❌ Multiple children per parent
- ❌ Parent/child separation

## Current Flow
```
User → Google Login → Child Profile Created → Welcome Screen → Learn/Quiz/Progress
```
