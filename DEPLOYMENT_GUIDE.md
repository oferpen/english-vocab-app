# 🚀 Deployment Guide - Vercel

## Quick Deploy Steps

### 1. Prepare Your Code
```bash
# Make sure everything works locally
npm run build
```

### 2. Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 3. Deploy to Vercel

#### Option A: Via Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com)** and sign in with GitHub

2. **Click "Add New..." → "Project"**

3. **Import your GitHub repository** (`english-vocab-app`)

4. **Configure Project:**
   - Framework: Next.js (auto-detected)
   - Root Directory: `./`
   - Build Command: `prisma generate && next build` (auto)
   - Output Directory: `.next` (auto)

5. **Add Environment Variables:**
   Click "Environment Variables" and add:
   
   ```
   DATABASE_URL = your_postgres_url_from_vercel
   GOOGLE_CLIENT_ID = your_google_client_id
   GOOGLE_CLIENT_SECRET = your_google_client_secret
   NEXTAUTH_SECRET = generate_a_random_secret
   NEXTAUTH_URL = https://your-app.vercel.app
   ```
   
   **To generate NEXTAUTH_SECRET:**
   ```bash
   openssl rand -base64 32
   ```

6. **Click "Deploy"**

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No (first time)
# - Project name: english-vocab-app
# - Directory: ./
# - Override settings? No
```

### 4. Set Up Database

#### If using Vercel Postgres (Recommended):

1. **In Vercel Dashboard:**
   - Go to your project → "Storage" tab
   - Click "Create Database" → "Postgres"
   - Create database
   - Copy the `POSTGRES_URL` (this is your `DATABASE_URL`)

2. **Update Environment Variable:**
   - Go to Project Settings → Environment Variables
   - Add/Update `DATABASE_URL` with the Postgres URL

3. **Update Prisma Schema:**
   Make sure `prisma/schema.prisma` has:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

4. **Run Migrations & Seed:**
   ```bash
   # In Vercel Dashboard → Deployments → Click on latest deployment → "View Function Logs"
   # Or use Vercel CLI:
   vercel env pull .env.local
   npx prisma migrate deploy
   npx prisma db seed
   ```

   **Or use Vercel Postgres Dashboard:**
   - Go to Storage → Your Database → "SQL Editor"
   - Run the SQL from your migrations

### 5. Update Google OAuth Settings

1. **Go to [Google Cloud Console](https://console.cloud.google.com)**

2. **APIs & Services → Credentials**

3. **Edit your OAuth 2.0 Client**

4. **Add Authorized Redirect URIs:**
   ```
   https://your-app.vercel.app/api/auth/callback/google
   ```

5. **Save**

### 6. Verify Deployment

1. Visit your app: `https://your-app.vercel.app`
2. Test Google login
3. Test PIN login (1234)
4. Check that data persists

---

## Environment Variables Checklist

Make sure these are set in Vercel:

- ✅ `DATABASE_URL` - Your PostgreSQL connection string
- ✅ `GOOGLE_CLIENT_ID` - From Google Cloud Console
- ✅ `GOOGLE_CLIENT_SECRET` - From Google Cloud Console  
- ✅ `NEXTAUTH_SECRET` - Random secret (use `openssl rand -base64 32`)
- ✅ `NEXTAUTH_URL` - Your Vercel app URL (e.g., `https://your-app.vercel.app`)

---

## Troubleshooting

### Build Fails
- Check build logs in Vercel Dashboard
- Ensure `DATABASE_URL` is set correctly
- Verify Prisma schema matches your database provider

### Database Connection Issues
- Check `DATABASE_URL` format
- Ensure database is created and accessible
- Try running migrations manually

### Google Login Not Working
- Verify redirect URI is added in Google Console
- Check `NEXTAUTH_URL` matches your actual domain
- Ensure environment variables are set correctly

### PIN Not Working
- Run seed script: `npx prisma db seed`
- Check database has parent account with PIN hash
- Verify PIN is "1234" in seed file

---

## Auto-Deploy

Once set up, every push to `main` branch will automatically deploy! 🎉

---

## Need Help?

- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
