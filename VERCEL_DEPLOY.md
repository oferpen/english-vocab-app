# מדריך פריסה ל-Vercel - שלב אחר שלב

## ⚠️ חשוב: SQLite לא עובד ב-Vercel

Vercel משתמש ב-read-only filesystem, אז SQLite לא יעבוד. יש שתי אפשרויות:

### אופציה 1: Turso (SQLite Cloud) - מומלץ
### אופציה 2: PostgreSQL (Vercel Postgres)

---

## שלב 1: הכנה מקומית

### 1.1 ודא שהקוד מוכן:
```bash
npm run build
```

אם זה עובד - מעולה! ✅

---

## שלב 2: הגדר Turso (SQLite Cloud)

### 2.1 הירשם ל-Turso:
1. היכנס ל-[turso.tech](https://turso.tech)
2. Sign up (חינם)
3. צור organization

### 2.2 התקן Turso CLI:
```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

או עם Homebrew:
```bash
brew install tursodatabase/tap/turso
```

### 2.3 התחבר:
```bash
turso auth login
```

### 2.4 צור database:
```bash
turso db create english-vocab
```

### 2.5 קבל את ה-URL:
```bash
turso db show english-vocab
```

תקבל משהו כמו:
```
libsql://english-vocab-xxxxx.turso.io
```

### 2.6 קבל auth token:
```bash
turso db tokens create english-vocab
```

שמור את ה-token!

### 2.7 עדכן את Prisma Schema:

עדכן את `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "libsql"
  url      = env("DATABASE_URL")
}
```

### 2.8 עדכן את ה-URL:
```bash
# הוסף ל-.env
DATABASE_URL="libsql://english-vocab-xxxxx.turso.io?authToken=YOUR_TOKEN"
```

### 2.9 Push את ה-schema:
```bash
npx prisma db push
npx prisma generate
```

### 2.10 Seed את הנתונים:
```bash
npm run db:seed
```

---

## שלב 3: העלה ל-GitHub

### 3.1 אתחל Git:
```bash
git init
git add .
git commit -m "Initial commit - ready for Vercel"
```

### 3.2 צור Repository ב-GitHub:
1. היכנס ל-[github.com](https://github.com)
2. לחץ "+" → "New repository"
3. שם: `english-vocab-app` (או כל שם)
4. בחר Public או Private
5. **אל תסמן** "Initialize with README"
6. לחץ "Create repository"

### 3.3 חבר את ה-repo:
```bash
git remote add origin https://github.com/YOUR_USERNAME/english-vocab-app.git
git branch -M main
git push -u origin main
```

---

## שלב 4: פרוס ל-Vercel

### 4.1 היכנס ל-Vercel:
1. היכנס ל-[vercel.com](https://vercel.com)
2. לחץ "Sign Up"
3. בחר "Continue with GitHub"
4. אשר את ההרשאות

### 4.2 ייבא את הפרויקט:
1. לחץ "Add New..." → "Project"
2. בחר את ה-repo `english-vocab-app`
3. לחץ "Import"

### 4.3 הגדר את הפרויקט:
- **Framework Preset:** Next.js (אוטומטי)
- **Root Directory:** `./` (ברירת מחדל)
- **Build Command:** `prisma generate && next build` (אוטומטי)
- **Output Directory:** `.next` (אוטומטי)

### 4.4 הוסף Environment Variables:
לחץ "Environment Variables" והוסף:

```
DATABASE_URL = libsql://english-vocab-xxxxx.turso.io?authToken=YOUR_TOKEN
```

**⚠️ חשוב:** החלף את `xxxxx` ו-`YOUR_TOKEN` בערכים האמיתיים מ-Turso!

### 4.5 Deploy:
לחץ "Deploy"!

---

## שלב 5: בדיקה

1. אחרי הפריסה, תקבל URL כמו: `english-vocab-app.vercel.app`
2. פתח את ה-URL בדפדפן
3. בדוק שהאפליקציה עובדת
4. נסה להתחבר עם PIN: `1234`

---

## אופציה חלופית: PostgreSQL

אם אתה מעדיף PostgreSQL:

### 1. ב-Vercel Dashboard:
- לחץ "Storage" → "Create Database"
- בחר "Postgres"
- צור database

### 2. עדכן Prisma Schema:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 3. צור Migration:
```bash
npx prisma migrate dev --name init
```

### 4. Seed:
```bash
npm run db:seed
```

### 5. הוסף Environment Variable:
- Vercel יוסיף את `DATABASE_URL` אוטומטית

---

## טיפים

✅ **Auto Deploy:** כל push ל-GitHub יפרס אוטומטית  
✅ **Preview Deployments:** כל PR מקבל URL נפרד  
✅ **Custom Domain:** הוסף domain משלך בחינם  
✅ **Analytics:** Vercel Analytics בחינם  

---

## פתרון בעיות

### Build נכשל:
- בדוק את ה-logs ב-Vercel Dashboard
- ודא ש-`DATABASE_URL` מוגדר נכון
- ודא ש-`prisma generate` רץ לפני build

### Database לא עובד:
- ודא שה-URL נכון
- בדוק שה-token תקין
- נסה ל-run `prisma db push` מקומית

### PIN לא עובד:
- ודא שה-seed רץ בהצלחה
- בדוק את ה-database ב-Turso dashboard

---

## קישורים שימושיים

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Turso Dashboard](https://turso.tech/dashboard)
- [Vercel Docs](https://vercel.com/docs)
- [Turso Docs](https://docs.turso.tech)
