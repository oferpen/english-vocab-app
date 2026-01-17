# Quick Test Guide

## ✅ Setup Complete!
- Database schema: ✓
- Email provider: ✓
- Google provider: ✓
- Environment variables: ✓

## 🧪 Test Now

### 1. Test Magic Link Sign-In
1. Open: `http://localhost:3000/parent/new-page`
2. Enter your email
3. Click "שלח קישור התחברות" (Send login link)
4. Check your email inbox
5. Click the magic link
6. Should redirect to `/parent/panel`

### 2. Test Google Sign-In
1. Open: `http://localhost:3000/parent/new-page`
2. Click "התחבר עם Google" (Sign in with Google)
3. Complete Google OAuth flow
4. Should redirect to `/parent/panel`

### 3. Test Parent Gate
1. After signing in, you'll see `/parent/panel`
2. A math question should appear (e.g., "5 + 3 = ?")
3. Enter the correct answer
4. Should see parent panel with your email

### 4. Test Profile Picker
1. Open: `http://localhost:3000/new-home`
2. If no children exist: Should show "אין ילדים במערכת"
3. If children exist: Should show profile picker with avatars

## 🐛 Common Issues

### "Invalid API key"
- Check `.env` file has correct Supabase values
- Restart dev server: `npm run dev`

### Magic link not received
- Check spam folder
- Check Supabase logs: Authentication → Logs
- Verify email provider is enabled

### Google sign-in redirects but doesn't work
- Check redirect URL in Google Cloud Console matches Supabase callback
- Should be: `https://dmzooauejmlkzdkrnlxj.supabase.co/auth/v1/callback`

### "Table does not exist"
- Make sure you ran the SQL schema in Supabase SQL Editor
- Check Tables section in Supabase Dashboard

## 📝 Next Steps

Once authentication works:
1. Create a child profile (via parent panel)
2. Test profile picker with actual child
3. Test welcome screen
4. Gradually migrate old pages to new system
