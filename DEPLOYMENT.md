# מדריך פריסה (Deployment Guide)

## אפשרויות פריסה

### 1. Vercel (מומלץ ל-Next.js) ⚡

**יתרונות:**
- מותאם ל-Next.js
- פריסה מהירה
- SSL אוטומטי
- CDN מובנה

**שלבים:**

1. התקן Vercel CLI:
```bash
npm i -g vercel
```

2. התחבר:
```bash
vercel login
```

3. פרוס:
```bash
vercel
```

4. להגדיר משתני סביבה:
   - היכנס ל-Vercel Dashboard
   - Settings → Environment Variables
   - הוסף: `DATABASE_URL` (ראה למטה)

**⚠️ חשוב:** SQLite לא עובד טוב ב-Vercel (filesystem read-only). יש שתי אפשרויות:

**אופציה A: העבר ל-PostgreSQL (מומלץ לייצור)**
- השתמש ב-Vercel Postgres או Neon
- עדכן `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**אופציה B: השתמש ב-Turso (SQLite cloud)**
- [Turso](https://turso.tech/) - SQLite מבוזר
- עדכן `DATABASE_URL` ל-URL של Turso

---

### 2. Railway 🚂

**יתרונות:**
- תמיכה מעולה ב-SQLite
- PostgreSQL בחינם
- קל להגדרה

**שלבים:**

1. היכנס ל-[Railway.app](https://railway.app)
2. לחץ "New Project"
3. בחר "Deploy from GitHub repo"
4. בחר את ה-repo שלך
5. Railway יזהה Next.js ויפרס אוטומטית
6. הוסף PostgreSQL (אופציונלי):
   - לחץ "+ New" → "Database" → "PostgreSQL"
   - העתק את ה-`DATABASE_URL`
   - הוסף כ-Environment Variable

**להגדרת SQLite:**
- הוסף Environment Variable: `DATABASE_URL=file:./prisma/prod.db`
- הוסף build command: `prisma generate && prisma db push && npm run build`
- הוסף start command: `npm start`

---

### 3. Render 🎨

**יתרונות:**
- חינם ל-projects קטנים
- תמיכה ב-SQLite (עם הגבלות)

**שלבים:**

1. היכנס ל-[Render.com](https://render.com)
2. לחץ "New +" → "Web Service"
3. חבר את GitHub repo
4. הגדרות:
   - **Build Command:** `npm install && npx prisma generate && npx prisma db push && npm run build`
   - **Start Command:** `npm start`
   - **Environment:** `Node`
5. הוסף Environment Variables:
   - `DATABASE_URL=file:./prisma/prod.db`
   - `NODE_ENV=production`

**⚠️ הערה:** ב-Render, SQLite עובד אבל הנתונים לא נשמרים בין deployments. מומלץ PostgreSQL.

---

### 4. Fly.io 🪰

**יתרונות:**
- תמיכה מעולה ב-SQLite
- Volume persistence
- חינם ל-apps קטנים

**שלבים:**

1. התקן Fly CLI:
```bash
curl -L https://fly.io/install.sh | sh
```

2. התחבר:
```bash
fly auth login
```

3. צור app:
```bash
fly launch
```

4. צור volume ל-SQLite:
```bash
fly volumes create data --size 1
```

5. עדכן `fly.toml`:
```toml
[mounts]
  source = "data"
  destination = "/app/prisma"
```

6. הוסף Environment Variable:
```bash
fly secrets set DATABASE_URL="file:/app/prisma/prod.db"
```

---

### 5. Self-Hosted (VPS) 🖥️

**אפשרויות:**
- DigitalOcean Droplet
- Linode
- AWS EC2
- Hetzner

**שלבים כלליים:**

1. הכן שרת (Ubuntu/Debian):
```bash
# התקן Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# התקן PM2
sudo npm install -g pm2
```

2. Clone את ה-repo:
```bash
git clone <your-repo-url>
cd english
npm install
```

3. הגדר Environment:
```bash
echo 'DATABASE_URL="file:./prisma/prod.db"' > .env
npx prisma generate
npx prisma db push
npm run db:seed
```

4. בנה:
```bash
npm run build
```

5. הפעל עם PM2:
```bash
pm2 start npm --name "english-app" -- start
pm2 save
pm2 startup
```

6. הגדר Nginx (אופציונלי):
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## המלצה: PostgreSQL לייצור

לפריסה בייצור, מומלץ להעביר ל-PostgreSQL:

### 1. עדכן Prisma Schema:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2. צור Migration:

```bash
npx prisma migrate dev --name init
```

### 3. עדכן Seed:

```bash
npm run db:seed
```

### 4. פרוס עם PostgreSQL:

- **Vercel:** Vercel Postgres (חינם)
- **Railway:** PostgreSQL addon (חינם)
- **Render:** PostgreSQL (חינם)
- **Fly.io:** Postgres app

---

## Environment Variables לייצור

הוסף את המשתנים הבאים:

```env
DATABASE_URL="your-database-url"
NODE_ENV="production"
```

---

## בדיקות לפני פריסה

1. ✅ בדוק שהאפליקציה רצה מקומית: `npm run build && npm start`
2. ✅ ודא ש-seed עובד: `npm run db:seed`
3. ✅ בדוק שהחיבור למסד נתונים תקין
4. ✅ ודא ש-PIN מוגדר (לא ברירת מחדל)

---

## טיפים

- **SQLite:** עובד טוב לפריסות קטנות/פיתוח
- **PostgreSQL:** מומלץ לייצור, יותר יציב ו-scalable
- **Backup:** הגדר גיבויים אוטומטיים למסד נתונים
- **Monitoring:** השתמש ב-services כמו Sentry לשגיאות
- **SSL:** רוב הפלטפורמות מספקות SSL אוטומטי

---

## קישורים שימושיים

- [Vercel Deployment](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
- [Fly.io Docs](https://fly.io/docs)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
