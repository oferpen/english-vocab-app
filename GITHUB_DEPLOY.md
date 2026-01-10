# פריסה חינמית דרך GitHub

## ⚠️ חשוב: GitHub לא מארח Next.js apps ישירות

GitHub Pages תומך רק באתרים סטטיים. Next.js דורש שרת Node.js, אז צריך להשתמש בשירותי אירוח חיצוניים.

**אבל:** אתה יכול להשתמש ב-GitHub כדי לפרוס אוטומטית לשירותים חינמיים!

---

## 🚀 אפשרויות חינמיות דרך GitHub

### 1. Vercel (הכי קל) ⭐ מומלץ

**חינם לחלוטין** - כולל:
- ✅ פריסה אוטומטית מ-GitHub
- ✅ SSL אוטומטי
- ✅ CDN גלובלי
- ✅ Unlimited bandwidth
- ✅ Custom domains

**שלבים:**

1. **Push את הקוד ל-GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/english-vocab-app.git
git push -u origin main
```

2. **היכנס ל-[Vercel.com](https://vercel.com)**
   - Sign up עם GitHub
   - לחץ "Add New Project"
   - בחר את ה-repo שלך
   - Vercel יזהה Next.js אוטומטית

3. **הגדר Environment Variables:**
   - Settings → Environment Variables
   - הוסף: `DATABASE_URL`
   - ⚠️ **חשוב:** SQLite לא עובד ב-Vercel
   - **פתרון:** השתמש ב-[Turso](https://turso.tech/) (SQLite cloud, חינם) או Vercel Postgres

4. **לחץ Deploy** - זהו! 🎉

**לאחר מכן:** כל push ל-GitHub יפרס אוטומטית!

---

### 2. Railway (תמיכה מעולה ב-SQLite)

**חינם** - $5 credit בחודש (מספיק ל-apps קטנים)

**שלבים:**

1. **Push ל-GitHub** (כמו למעלה)

2. **היכנס ל-[Railway.app](https://railway.app)**
   - Sign up עם GitHub
   - לחץ "New Project"
   - בחר "Deploy from GitHub repo"
   - בחר את ה-repo

3. **Railway יפרס אוטומטית!**
   - הוסף Environment Variable: `DATABASE_URL=file:./prisma/prod.db`
   - או הוסף PostgreSQL (חינם)

---

### 3. Render

**חינם** - עם הגבלות

**שלבים:**

1. **Push ל-GitHub**

2. **היכנס ל-[Render.com](https://render.com)**
   - Sign up עם GitHub
   - לחץ "New +" → "Web Service"
   - בחר את ה-repo

3. **הגדרות:**
   - Build Command: `npm install && npx prisma generate && npx prisma db push && npm run build`
   - Start Command: `npm start`
   - Environment: `Node`

4. **הוסף Environment Variables:**
   - `DATABASE_URL=file:./prisma/prod.db`
   - `NODE_ENV=production`

---

### 4. Fly.io

**חינם** - 3 shared VMs

**שלבים:**

1. **Push ל-GitHub**

2. **התקן Fly CLI:**
```bash
curl -L https://fly.io/install.sh | sh
```

3. **התחבר:**
```bash
fly auth login
```

4. **צור app:**
```bash
fly launch
```
   - זה יגדיר הכל אוטומטית!

---

## 📋 Checklist לפני פריסה

- [ ] Push את הקוד ל-GitHub
- [ ] בדוק שהאפליקציה עובדת מקומית (`npm run build`)
- [ ] ודא ש-PIN שונה מ-1234
- [ ] החלט על מסד נתונים (SQLite cloud או PostgreSQL)
- [ ] הוסף `.env` ל-`.gitignore` (אם יש)

---

## 🔧 הגדרת GitHub Repository

### 1. צור Repository חדש:

1. היכנס ל-GitHub
2. לחץ "+" → "New repository"
3. שם: `english-vocab-app` (או כל שם)
4. בחר Public או Private
5. **אל תסמן** "Initialize with README"
6. לחץ "Create repository"

### 2. Push את הקוד:

```bash
# אם עדיין לא עשית git init
git init
git add .
git commit -m "Initial commit"

# חבר ל-GitHub
git remote add origin https://github.com/YOUR_USERNAME/english-vocab-app.git
git branch -M main
git push -u origin main
```

### 3. ודא ש-`.gitignore` כולל:

```
node_modules/
.next/
.env
.env.local
*.db
*.db-journal
.DS_Store
```

---

## 💡 המלצה

**להתחלה מהירה:** Vercel + Turso
- Vercel: פריסה אוטומטית מ-GitHub
- Turso: SQLite cloud חינמי
- הכל עובד ב-5 דקות!

**לפריסה יציבה:** Railway + PostgreSQL
- Railway: תמיכה מעולה
- PostgreSQL: יציב יותר מ-SQLite
- חינם ל-apps קטנים

---

## 🎯 סיכום

| שירות | חינם? | SQLite? | קל? | מומלץ? |
|-------|-------|---------|-----|--------|
| **Vercel** | ✅ | ❌ (צריך Turso) | ⭐⭐⭐ | ⭐⭐⭐ |
| **Railway** | ✅ ($5 credit) | ✅ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Render** | ✅ | ⚠️ (מוגבל) | ⭐⭐ | ⭐⭐ |
| **Fly.io** | ✅ | ✅ | ⭐⭐ | ⭐⭐ |

**הכי קל:** Vercel (אבל צריך Turso ל-SQLite)  
**הכי טוב ל-SQLite:** Railway

---

## 🚀 Quick Start - Vercel (5 דקות)

```bash
# 1. Push ל-GitHub
git init
git add .
git commit -m "Ready to deploy"
git remote add origin https://github.com/YOUR_USERNAME/english-vocab-app.git
git push -u origin main

# 2. היכנס ל-vercel.com
# 3. Sign up עם GitHub
# 4. לחץ "Import Project"
# 5. בחר את ה-repo
# 6. Deploy!
```

**זהו!** האפליקציה שלך תהיה online תוך דקות! 🎉
