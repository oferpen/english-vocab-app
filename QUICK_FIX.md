# Quick Fix: Add DATABASE_URL to Vercel

## הבעיה
ה-build נכשל כי `DATABASE_URL` לא מוגדר.

## פתרון מהיר: השתמש ב-Neon (PostgreSQL חינמי)

### שלב 1: צור Database ב-Neon

1. היכנס ל-[neon.tech](https://neon.tech)
2. Sign up (חינם)
3. לחץ "Create Project"
4. שם: `english-vocab`
5. Region: בחר הכי קרוב אליך
6. לחץ "Create Project"

### שלב 2: קבל את Connection String

1. אחרי ש-Neon יוצר את ה-project, תראה את ה-Dashboard
2. לחץ על "Connection Details" או "Connection String"
3. תעתיק את ה-connection string
   - זה נראה כמו: `postgresql://user:password@host/database?sslmode=require`

### שלב 3: הוסף ל-Vercel Environment Variables

1. ב-Vercel Dashboard → Project Settings
2. לחץ "Environment Variables" (בסרגל הצד)
3. לחץ "Add New"
4. Name: `DATABASE_URL`
5. Value: הדבק את ה-connection string מ-Neon
6. בחר את ה-Environments: Production, Preview, Development (כולם)
7. לחץ "Save"

### שלב 4: Redeploy

1. חזור ל-Deployments
2. לחץ על ה-3 dots של ה-deployment האחרון
3. לחץ "Redeploy"
4. או פשוט push שינוי חדש ל-GitHub

זה אמור לעבוד! 🎉
