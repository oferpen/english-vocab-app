# 🔗 Connect Existing Database to Your Project

## You Already Have a Database!

I can see you have a database called **"prisma-postgres-orange-book"** in Vercel Storage.

## Steps to Connect It

### Step 1: Connect the Database
1. On the Storage page, click the **"Connect"** button next to "prisma-postgres-orange-book"
2. Select your project: **english-vocab-app** (or whatever your project is named)
3. Click **"Connect"**

### Step 2: Verify DATABASE_URL is Set
After connecting:
1. Go to **"Settings"** → **"Environment Variables"**
2. Check if `DATABASE_URL` appears automatically
3. If it's there ✅ - you're good!
4. If it's not there:
   - Go back to Storage → Click on "prisma-postgres-orange-book"
   - Copy the **"Connection String"** or **"POSTGRES_URL"**
   - Add it manually as `DATABASE_URL` in Environment Variables

### Step 3: Set Up Database Schema

After connecting, you need to create the tables:

**Option A: Via Vercel CLI**
```bash
# Pull environment variables
vercel env pull .env.production

# Set DATABASE_URL
export DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2-)

# Push schema
npx prisma db push

# Seed database
npx prisma db seed
```

**Option B: Via Vercel Postgres SQL Editor**
1. Go to Storage → Click "prisma-postgres-orange-book"
2. Click "SQL Editor" tab
3. Run migrations manually (or use Prisma Studio)

### Step 4: Redeploy
1. Go to **"Deployments"** tab
2. Click **"..."** on latest deployment → **"Redeploy"**

## Verify It Works

After redeploying:
1. Visit your app: `https://english-three-phi.vercel.app`
2. Should load without errors ✅
3. Try Google login or PIN login

---

**Note:** If the database is empty, make sure to run `npx prisma db seed` to add the initial data (words, default parent account with PIN 1234, etc.)
