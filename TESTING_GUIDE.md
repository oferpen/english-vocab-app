# Testing Guide: New Authentication System

## ✅ Step 1: Database Schema - DONE!

## 🔧 Step 2: Configure Authentication Providers

### Email Provider:
1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. Find **Email** provider
3. Click to enable it
4. Keep default settings
5. Save

### Google Provider:
1. In **Authentication** → **Providers**
2. Find **Google** provider
3. Click to enable it
4. Add your credentials:
   - **Client ID**: `YOUR_GOOGLE_CLIENT_ID`
   - **Client Secret**: `YOUR_GOOGLE_CLIENT_SECRET`
5. Save

### Redirect URLs:
1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `http://localhost:3000`
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/**`

## 🧪 Step 3: Test the System

### Start Dev Server:
```bash
npm run dev
```

### Test 1: Magic Link Sign-In
1. Go to: `http://localhost:3000/parent/new-page`
2. Enter your email address
3. Click "שלח קישור התחברות"
4. Check your email for magic link
5. Click the link
6. Should redirect to `/parent/panel`

### Test 2: Google Sign-In
1. Go to: `http://localhost:3000/parent/new-page`
2. Click "התחבר עם Google"
3. Complete Google OAuth flow
4. Should redirect to `/parent/panel`

### Test 3: Parent Gate
1. After signing in, you'll see `/parent/panel`
2. Should show a math question (e.g., "5 + 3 = ?")
3. Enter correct answer
4. Should see parent panel with your email

### Test 4: Profile Picker
1. Go to: `http://localhost:3000/new-home`
2. If no children exist, should show "אין ילדים במערכת"
3. If children exist, should show profile picker

## 🐛 Troubleshooting

### "Invalid API key" error
- Check `.env` file has correct values
- Restart dev server: `npm run dev`

### "Table does not exist" error
- Make sure you ran the SQL schema
- Check Tables section in Supabase Dashboard

### Magic link not received
- Check spam folder
- Check Supabase logs: **Authentication** → **Logs**
- Verify email provider is enabled

### Google sign-in not working
- Check Google provider is enabled
- Verify credentials are correct
- Check redirect URL matches Supabase settings

### "RLS policy violation" error
- This is normal if user is not authenticated
- Make sure you're signed in
- Check Supabase logs for details

## 📝 Next Steps After Testing

Once everything works:
1. Create a child profile (via parent panel)
2. Test profile picker with actual child
3. Test welcome screen
4. Gradually migrate old pages to new system
