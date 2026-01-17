# 🔍 Debugging Production Error

## Error Message
```
[Error: An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details. A digest property is included on this error instance which may provide additional details about the nature of the error.] { digest: '268010594' }
```

## How to Find the Real Error

### Step 1: Check Vercel Logs
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click your project → **"Deployments"** tab
3. Click on the latest deployment
4. Click **"View Function Logs"** or **"Runtime Logs"**
5. Look for error messages around the time the error occurred

### Step 2: Common Causes

#### 1. Database Connection Issue
**Symptoms:** Error on page load, can't connect to database

**Check:**
- Is `DATABASE_URL` set in Vercel Environment Variables?
- Is the database URL correct?
- Is the database accessible from Vercel?

**Fix:**
- Verify `DATABASE_URL` in Vercel Settings → Environment Variables
- Test connection string locally
- Make sure database is created and accessible

#### 2. Missing Environment Variables
**Symptoms:** Google login not working, database errors

**Check:**
- `DATABASE_URL` - PostgreSQL connection string
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth secret
- `NEXTAUTH_SECRET` - Random secret for NextAuth
- `NEXTAUTH_URL` - Your Vercel app URL

**Fix:**
- Add all missing variables in Vercel Settings → Environment Variables
- Redeploy after adding variables

#### 3. Database Schema Not Migrated
**Symptoms:** Tables don't exist errors

**Check Vercel Logs for:**
```
The table `public.parent_accounts` does not exist
```

**Fix:**
```bash
# Pull environment variables
vercel env pull .env.production

# Run migrations
npx prisma migrate deploy

# Or push schema
npx prisma db push
```

#### 4. Prisma Client Not Generated
**Symptoms:** Prisma client errors

**Fix:**
- Vercel should run `prisma generate` automatically
- Check build logs to confirm it ran
- If not, add to build command: `prisma generate && next build`

### Step 3: Enable Better Error Logging

Add this to your server components temporarily:

```typescript
try {
  // your code
} catch (error) {
  console.error('Server component error:', error);
  throw error; // Re-throw to see in logs
}
```

### Step 4: Check Specific Pages

The error might be on a specific page. Check:
- `/` (home page)
- `/learn`
- `/quiz`
- `/progress`
- `/parent`

### Step 5: Quick Fixes to Try

1. **Redeploy:**
   - Go to Deployments → Latest → "..." → "Redeploy"

2. **Check Database:**
   ```bash
   vercel env pull .env.production
   export DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2-)
   npx prisma db push
   npx prisma db seed
   ```

3. **Verify Environment Variables:**
   - Vercel Dashboard → Settings → Environment Variables
   - Make sure all are set for "Production" environment

4. **Check Build Logs:**
   - Look for any warnings or errors during build
   - Check if Prisma generated successfully

## Most Likely Issue

Based on the error, it's probably:
1. **Database connection** - `DATABASE_URL` not set or incorrect
2. **Database not migrated** - Tables don't exist
3. **Missing env vars** - Required variables not set

## Next Steps

1. ✅ Check Vercel Function Logs for the actual error
2. ✅ Verify all environment variables are set
3. ✅ Check database connection
4. ✅ Run database migrations if needed
5. ✅ Redeploy

---

**Tip:** The error digest `268010594` is just a hash - check the actual logs in Vercel Dashboard for the real error message!
