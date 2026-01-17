# Fix Google OAuth Redirect URI Error

## Error
`Error 400: redirect_uri_mismatch`

## Solution

The redirect URI in Google Cloud Console must match Supabase's callback URL.

### Step 1: Get Your Supabase Callback URL

Your Supabase project URL: `https://dmzooauejmlkzdkrnlxj.supabase.co`

Supabase callback URL: `https://dmzooauejmlkzdkrnlxj.supabase.co/auth/v1/callback`

### Step 2: Add Redirect URI to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID (the one ending in `.apps.googleusercontent.com`)
5. Under **Authorized redirect URIs**, add:
   ```
   https://dmzooauejmlkzdkrnlxj.supabase.co/auth/v1/callback
   ```
6. Click **Save**

### Step 3: Verify in Supabase

1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. Click on **Google** provider
3. Make sure your Google Client ID and Secret are correct:
   - Client ID: `YOUR_GOOGLE_CLIENT_ID`
   - Client Secret: `YOUR_GOOGLE_CLIENT_SECRET`

### Step 4: Test Again

1. Go to `http://localhost:3000`
2. Click "התחבר עם Google"
3. Should work now!

## Important Notes

- The redirect URI must be **exactly** `https://dmzooauejmlkzdkrnlxj.supabase.co/auth/v1/callback`
- Don't add `http://localhost:3000/auth/callback` - Supabase handles the OAuth flow
- After Google OAuth completes, Supabase redirects to your app's `/auth/callback` route
