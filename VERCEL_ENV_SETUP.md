# 🔧 Fix Google Login on Vercel - Quick Guide

## Problem
You're seeing: "Warning: No OAuth providers configured. Google login will not be available."

This means the environment variables are missing in Vercel.

## Solution: Add Environment Variables in Vercel

### Step 1: Go to Vercel Dashboard
1. Visit [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your project: **english-vocab-app** (or whatever it's named)

### Step 2: Add Environment Variables
1. Click **"Settings"** tab (top menu)
2. Click **"Environment Variables"** (left sidebar)
3. Click **"Add New"** button

### Step 3: Add These Variables

Add each variable one by one:

#### 1. GOOGLE_CLIENT_ID
- **Key:** `GOOGLE_CLIENT_ID`
- **Value:** `YOUR_GOOGLE_CLIENT_ID`
- **Environment:** Select all (Production, Preview, Development)
- Click **"Save"**

#### 2. GOOGLE_CLIENT_SECRET
- **Key:** `GOOGLE_CLIENT_SECRET`
- **Value:** `YOUR_GOOGLE_CLIENT_SECRET`
- **Environment:** Select all (Production, Preview, Development)
- Click **"Save"**

#### 3. NEXTAUTH_SECRET
- **Key:** `NEXTAUTH_SECRET`
- **Value:** Generate one with: `openssl rand -base64 32`
- **Environment:** Select all
- Click **"Save"**

#### 4. NEXTAUTH_URL
- **Key:** `NEXTAUTH_URL`
- **Value:** `https://english-three-phi.vercel.app` (your actual Vercel URL)
- **Environment:** Select all
- Click **"Save"**

#### 5. DATABASE_URL (if not already set)
- **Key:** `DATABASE_URL`
- **Value:** Your PostgreSQL connection string from Vercel Storage
- **Environment:** Select all
- Click **"Save"**

### Step 4: Redeploy
After adding all variables:
1. Go to **"Deployments"** tab
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**
4. Or just push a new commit to trigger auto-deploy

### Step 5: Update Google OAuth Redirect URI
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **"Authorized redirect URIs"**, add:
   ```
   https://english-three-phi.vercel.app/api/auth/callback/google
   ```
5. Click **"Save"**

## Verify It Works
1. Visit your app: https://english-three-phi.vercel.app
2. Try Google login
3. Should work now! ✅

## Quick Checklist
- [ ] GOOGLE_CLIENT_ID added to Vercel
- [ ] GOOGLE_CLIENT_SECRET added to Vercel
- [ ] NEXTAUTH_SECRET added to Vercel
- [ ] NEXTAUTH_URL added to Vercel (with your actual URL)
- [ ] DATABASE_URL added to Vercel
- [ ] Redirect URI added to Google Console
- [ ] Redeployed the app

---

**Note:** After adding environment variables, you MUST redeploy for them to take effect!
