# 🔧 Fix Login Issues - Diagnostic Guide

## Current Status
✅ Homepage loads correctly  
✅ API endpoints work  
✅ Google provider is configured  
❌ Google sign-in returns HTTP 400  
❌ Anonymous login may be hanging  

## Most Likely Issues

### 1. NEXTAUTH_URL Mismatch
**Problem:** `NEXTAUTH_URL` in Vercel doesn't match your actual domain.

**Fix:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Check `NEXTAUTH_URL` value
3. It should be: `https://www.englishpath.xyz` (exactly, with https://)
4. If it's different, update it and redeploy

### 2. Google OAuth Redirect URI Mismatch
**Problem:** Redirect URI in Google Cloud Console doesn't match your production URL.

**Fix:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials
3. Click on your OAuth 2.0 Client ID
4. Under "Authorized redirect URIs", ensure you have:
   ```
   https://www.englishpath.xyz/api/auth/callback/google
   ```
5. If missing or different, add it and save

### 3. Missing Environment Variables
**Check in Vercel:**
- `GOOGLE_CLIENT_ID` - Should be set
- `GOOGLE_CLIENT_SECRET` - Should be set  
- `NEXTAUTH_SECRET` - Should be set (random string)
- `NEXTAUTH_URL` - Should be `https://www.englishpath.xyz`
- `DATABASE_URL` - Should be set (for anonymous login)

### 4. Database Connection Issues
**Problem:** Anonymous login hangs because database queries timeout.

**Check:**
- Verify `DATABASE_URL` is correct in Vercel
- Check Vercel logs for database connection errors
- The timeout wrapper should prevent infinite hangs (3-5 second timeout)

## Quick Test Steps

1. **Check Environment Variables:**
   - Vercel Dashboard → Settings → Environment Variables
   - Verify all required variables are set

2. **Test Anonymous Login:**
   - Click "התחל הרפתקה!" button
   - Check browser console for errors
   - Should complete within 5 seconds (timeout)

3. **Test Google Login:**
   - Click "כניסה עם גוגל" button
   - Should redirect to Google OAuth
   - If HTTP 400, check redirect URI in Google Cloud Console

4. **Check Vercel Logs:**
   - Vercel Dashboard → Your Project → Logs
   - Look for errors related to:
     - `getCurrentUser timeout`
     - `Database query timeout`
     - `SignIn callback error`
     - OAuth errors

## After Fixing

1. **Redeploy:**
   - After changing environment variables, redeploy
   - Or push a new commit to trigger auto-deploy

2. **Clear Browser Cache:**
   - Hard refresh: `Ctrl+Shift+R` or `Cmd+Shift+R`
   - Or use Incognito/Private mode

3. **Test Again:**
   - Try anonymous login first (simpler)
   - Then try Google login
   - Check browser console for any errors

## Debugging Commands

Check if environment variables are accessible (in Vercel logs):
```bash
# These should appear in Vercel build logs:
echo $GOOGLE_CLIENT_ID
echo $NEXTAUTH_URL
```

Test the auth endpoint:
```bash
curl -I https://www.englishpath.xyz/api/auth/signin/google
# Should return 302 (redirect) not 400
```
