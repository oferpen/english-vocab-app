# מדריך פריסה ל-Vercel עם PostgreSQL

## ✅ מה כבר נעשה

1. ✅ Prisma schema עודכן ל-PostgreSQL
2. ✅ הקוד הועלה ל-GitHub

## שלב 1: צור Vercel Postgres Database

### 1.1 היכנס ל-Vercel:
1. לך ל-[vercel.com](https://vercel.com)
2. Sign up/Login עם GitHub

### 1.2 ייבא את הפרויקט:
1. לחץ "Add New..." → "Project"
2. בחר את ה-repo: `oferpen/english-vocab-app`
3. לחץ "Import"

### 1.3 צור Postgres Database:
**לפני שאתה לוחץ Deploy:**
1. בגלל ה-Project Settings, לחץ על "Storage" (בסרגל הצד)
2. לחץ "Create Database"
3. בחר "Postgres"
4. שם: `english-vocab-db` (או כל שם)
5. Region: בחר הכי קרוב אליך
6. לחץ "Create"

### 1.4 חבר את ה-Database לפרויקט:
1. חזור ל-Project Settings
2. לחץ "Environment Variables"
3. Vercel כבר הוסיף את `DATABASE_URL` אוטומטית! ✅
4. ודא שהוא מופיע שם

## שלב 2: Deploy

### 2.1 לחץ "Deploy"
- Vercel יבנה את הפרויקט אוטומטית
- זה יקח 1-2 דקות

### 2.2 אחרי ה-Deploy:
הפריסה תיכשל כי צריך לרוץ migrations!

## שלב 3: הרץ Migrations

### אופציה A: דרך Vercel CLI (מומלץ)

1. התקן Vercel CLI:
```bash
npm i -g vercel
```

2. התחבר:
```bash
vercel login
```

3. חבר את ה-Project:
```bash
vercel link
```

4. קבל את ה-DATABASE_URL:
```bash
vercel env pull .env.production
```

5. עדכן את ה-local .env:
```bash
# העתק את DATABASE_URL מ-.env.production ל-.env
```

6. הרץ migrations מקומית:
```bash
npx prisma migrate deploy
```

או צור migration חדש:
```bash
npx prisma migrate dev --name init
```

7. Seed את הנתונים:
```bash
npm run db:seed
```

### אופציה B: דרך Vercel Dashboard (Build Command)

1. ב-Vercel Dashboard → Project Settings → Build & Development Settings
2. עדכן את Build Command ל:
```bash
prisma generate && prisma migrate deploy && next build
```

3. Redeploy את הפרויקט

## שלב 4: Seed הנתונים

אחרי שה-migrations רצו, צריך ל-seed את הנתונים:

### דרך Vercel CLI:
```bash
# ודא שה-DATABASE_URL מוגדר
vercel env pull .env.production
export DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2-)

# הרץ seed
npm run db:seed
```

או דרך Vercel Dashboard:
1. Project Settings → Environment Variables
2. ודא ש-`DATABASE_URL` מוגדר
3. השתמש ב-Vercel CLI כמו למעלה

## שלב 5: בדיקה

1. פתח את ה-URL של הפריסה (כמו: `english-vocab-app.vercel.app`)
2. בדוק שהאפליקציה עובדת
3. נסה להתחבר עם PIN: `1234`

## פתרון בעיות

### Build נכשל:
- בדוק את ה-logs ב-Vercel Dashboard
- ודא ש-`DATABASE_URL` מוגדר
- ודא ש-`prisma generate` רץ לפני build

### Database connection error:
- ודא שה-Database נוצר ב-Vercel
- בדוק שה-`DATABASE_URL` נכון
- ודא שה-migrations רצו

### Seed לא עובד:
- ודא שה-migrations רצו קודם
- בדוק שה-`DATABASE_URL` נכון
- נסה לרוץ seed מקומית עם ה-production URL

## טיפים

✅ **Auto Deploy:** כל push ל-GitHub יפרס אוטומטית  
✅ **Preview Deployments:** כל PR מקבל URL נפרד  
✅ **Database Backups:** Vercel Postgres מגבה אוטומטית  
✅ **Monitoring:** Vercel Dashboard מראה metrics  

## קישורים שימושיים

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel Postgres Docs](https://vercel.com/docs/storage/vercel-postgres)
- [Prisma Migrations](https://www.prisma.io/docs/guides/migrate)
