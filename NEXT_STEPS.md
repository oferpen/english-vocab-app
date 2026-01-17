# Next Steps: Supabase Setup Complete! 🎉

## ✅ What's Done

1. **Environment Variables**: Added Supabase URL and API key to `.env`
   - `NEXT_PUBLIC_SUPABASE_URL=https://dmzooauejmlkzdkrnlxj.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_DSXUre-NCDX3hBWCRCy0bA_kyufkGkO`

2. **Database Schema**: Created `supabase-schema.sql` with all tables and RLS policies

## 🔧 What You Need to Do Now

### Step 1: Run Database Schema in Supabase

1. Go to your Supabase Dashboard: https://dmzooauejmlkzdkrnlxj.supabase.co
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire contents of `supabase-schema.sql`
5. Paste into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Verify tables were created (check Tables section)

### Step 2: Configure Authentication Providers

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. **Email Provider**:
   - Enable "Enable Email provider"
   - Keep default settings
3. **Google Provider**:
   - Enable "Enable Google provider"
   - Add your Google OAuth credentials:
     - Client ID: `YOUR_GOOGLE_CLIENT_ID`
     - Client Secret: `YOUR_GOOGLE_CLIENT_SECRET`
   - Save

### Step 3: Configure Redirect URLs

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `http://localhost:3000` (for development)
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/**` (for development)
   - Add your production URL when deploying

### Step 4: Test the New System

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Test Magic Link:
   - Go to `http://localhost:3000/parent/new-page`
   - Enter your email
   - Check email for magic link
   - Click link to sign in

3. Test Google Sign-In:
   - Click "התחבר עם Google"
   - Complete OAuth flow

4. Test Parent Panel:
   - After signing in, go to `http://localhost:3000/parent/panel`
   - Should show parent gate (math question)
   - Answer correctly to access panel

5. Test Profile Picker:
   - Go to `http://localhost:3000/new-home`
   - Should show profile picker (if no children) or welcome screen (if children exist)

## 🚀 Migration Path

### Option A: Gradual Migration (Recommended)

1. Keep old system running
2. Test new pages:
   - `/parent/new-page` - New sign-in
   - `/parent/panel` - New parent panel
   - `/new-home` - New home page
3. Once tested, replace:
   - `app/parent/page.tsx` → Copy from `app/parent/new-page.tsx`
   - `app/page.tsx` → Copy from `app/new-home.tsx`

### Option B: Full Switch

1. Backup current code
2. Replace all files at once
3. Test thoroughly
4. Deploy

## 📝 Important Notes

1. **RLS Policies**: The schema includes Row Level Security policies that ensure:
   - Parents can only see their own data
   - Parents can only manage their own children
   - Data is isolated between families

2. **Backward Compatibility**: The schema includes old table names (`words`, `progress`, etc.) for compatibility during migration

3. **Data Migration**: Existing data from Prisma/SQLite needs to be migrated:
   - `ParentAccount` → `parents`
   - `ChildProfile` → `child_profiles` (update `name` → `nickname`, `age` → `age_band`)

## 🐛 Troubleshooting

### "Invalid API key" error
- Check `.env` file has correct values
- Restart dev server after changing `.env`

### "Table does not exist" error
- Make sure you ran `supabase-schema.sql` in Supabase SQL Editor
- Check Tables section in Supabase Dashboard

### "RLS policy violation" error
- Check that user is authenticated
- Verify RLS policies were created correctly
- Check Supabase logs for details

### Magic link not working
- Check email spam folder
- Verify redirect URL is configured in Supabase
- Check Supabase logs for errors

## 📚 Files Reference

- `supabase-schema.sql` - Database schema to run in Supabase
- `lib/supabase.ts` - Client-side Supabase client
- `lib/supabase-server.ts` - Server-side Supabase client
- `components/auth/SignInForm.tsx` - Sign-in component
- `components/auth/ParentGate.tsx` - Parent gate component
- `components/auth/ProfilePicker.tsx` - Profile picker component
- `app/auth/callback/route.ts` - OAuth callback handler

## ✅ Checklist

- [ ] Run `supabase-schema.sql` in Supabase SQL Editor
- [ ] Configure Email provider in Supabase
- [ ] Configure Google provider in Supabase
- [ ] Set redirect URLs in Supabase
- [ ] Test magic link sign-in
- [ ] Test Google sign-in
- [ ] Test parent panel with gate
- [ ] Test profile picker
- [ ] Migrate existing data (if any)
- [ ] Replace old pages with new ones
