# 🔧 Fix DATABASE_URL Error

## The Problem
```
error: Environment variable not found: DATABASE_URL.
```

Your Prisma schema requires PostgreSQL (`provider = "postgresql"`), but `DATABASE_URL` is not set in Vercel.

## Solution: Add DATABASE_URL to Vercel

### Option 1: Use Vercel Postgres (Recommended)

1. **Go to Vercel Dashboard:**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click your project: **english-vocab-app**

2. **Create Postgres Database:**
   - Click **"Storage"** tab
   - Click **"Create Database"**
   - Select **"Postgres"**
   - Click **"Create"**
   - Wait for it to be created

3. **Get Connection String:**
   - After creation, you'll see the database details
   - Copy the **"Connection String"** or **"POSTGRES_URL"**
   - It looks like: `postgres://user:password@host:5432/database?sslmode=require`

4. **Add to Environment Variables:**
   - Go to **"Settings"** → **"Environment Variables"**
   - Click **"Add New"**
   - **Key:** `DATABASE_URL`
   - **Value:** Paste the connection string you copied
   - **Environment:** Select all (Production, Preview, Development)
   - Click **"Save"**

5. **Redeploy:**
   - Go to **"Deployments"** tab
   - Click **"..."** on latest deployment → **"Redeploy"**

### Option 2: Use External PostgreSQL (Neon, Supabase, etc.)

If you already have a PostgreSQL database:

1. **Get Connection String:**
   - Copy your PostgreSQL connection string
   - Format: `postgresql://user:password@host:5432/database?sslmode=require`

2. **Add to Vercel:**
   - Settings → Environment Variables
   - Add `DATABASE_URL` with your connection string
   - Redeploy

### Option 3: Switch Back to SQLite (Not Recommended for Production)

If you want to use SQLite instead:

1. **Update Prisma Schema:**
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

2. **Set DATABASE_URL:**
   - In Vercel, set `DATABASE_URL` to a file path (but this won't work on Vercel!)
   - **⚠️ SQLite doesn't work on Vercel** - you need PostgreSQL

## After Adding DATABASE_URL

### 1. Run Database Migrations

After redeploying, you need to set up the database schema:

**Option A: Via Vercel CLI (Recommended)**
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login
vercel login

# Link to your project
vercel link

# Pull environment variables
vercel env pull .env.production

# Set DATABASE_URL locally
export DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2-)

# Push schema to database
npx prisma db push

# Seed the database
npx prisma db seed
```

**Option B: Via Vercel Postgres Dashboard**
- Go to Storage → Your Database → "SQL Editor"
- Run the SQL from your migrations manually

### 2. Verify It Works

1. Visit your app: `https://english-three-phi.vercel.app`
2. Should load without errors now
3. Try Google login or PIN login

## Quick Checklist

- [ ] Created Postgres database in Vercel Storage (or have external PostgreSQL)
- [ ] Added `DATABASE_URL` to Vercel Environment Variables
- [ ] Set for all environments (Production, Preview, Development)
- [ ] Redeployed the app
- [ ] Ran database migrations (`prisma db push`)
- [ ] Seeded the database (`prisma db seed`)

---

**Important:** After adding `DATABASE_URL`, you MUST redeploy for it to take effect!
