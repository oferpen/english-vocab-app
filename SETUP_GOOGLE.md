# הגדרת Google Login - מדריך מהיר

## שלב 1: יצירת Google OAuth Credentials

1. **היכנס ל-[Google Cloud Console](https://console.cloud.google.com/)**
   - התחבר עם חשבון Google שלך

2. **צור פרויקט חדש או בחר פרויקט קיים**
   - לחץ על תפריט הפרויקטים למעלה
   - לחץ "New Project" או בחר פרויקט קיים

3. **הפעל את Google+ API:**
   - לחץ על "APIs & Services" > "Library"
   - חפש "Google+ API" או "Google Identity"
   - לחץ "Enable"

4. **צור OAuth 2.0 Credentials:**
   - לחץ על "APIs & Services" > "Credentials"
   - לחץ "Create Credentials" > "OAuth client ID"
   - אם זה הפעם הראשונה, תצטרך להגדיר את OAuth consent screen קודם:
     - בחר "External" (או "Internal" אם יש לך Google Workspace)
     - מלא את הפרטים הבסיסיים (שם האפליקציה, email)
     - לחץ "Save and Continue" עד הסוף
   - חזור ל-"Create Credentials" > "OAuth client ID"
   - בחר "Web application"
   - תן שם ל-client (למשל: "English Vocab App")
   - **הוסף Authorized redirect URIs:**
     ```
     http://localhost:3000/api/auth/callback/google
     ```
   - לחץ "Create"
   - **העתק את Client ID ו-Client Secret**

## שלב 2: הוסף את ה-Credentials ל-.env

1. **צור או עדכן קובץ `.env` בתיקיית הפרויקט:**

```bash
# אם אין קובץ .env, צור אותו:
touch .env
```

2. **הוסף את השורות הבאות ל-.env:**

```env
GOOGLE_CLIENT_ID=הדבק_כאן_את_ה-Client_ID_שלך
GOOGLE_CLIENT_SECRET=הדבק_כאן_את_ה-Client_Secret_שלך
NEXTAUTH_SECRET=צור_מחרוזת_אקראית_כאן
NEXTAUTH_URL=http://localhost:3000
```

3. **יצירת NEXTAUTH_SECRET:**
   ```bash
   openssl rand -base64 32
   ```
   העתק את התוצאה והדבק ב-`NEXTAUTH_SECRET`

## שלב 3: הפעל מחדש את השרת

```bash
# עצור את השרת (Ctrl+C) והפעל מחדש:
npm run dev
```

## שלב 4: בדיקה

1. פתח `http://localhost:3000/parent`
2. אתה אמור לראות את כפתור "התחבר עם Google" פעיל
3. לחץ עליו והתחבר עם Google
4. חשבון חדש ייווצר אוטומטית

## הערות חשובות:

- **לפריסה ב-Vercel:** הוסף את אותם משתני סביבה ב-Vercel Dashboard > Settings > Environment Variables
- **ל-Vercel production:** הוסף גם את ה-redirect URI הזה:
  ```
  https://your-app-name.vercel.app/api/auth/callback/google
  ```
- **אבטחה:** אל תעלה את קובץ `.env` ל-GitHub! הוא כבר ב-.gitignore

## פתרון בעיות:

- אם הכפתור עדיין לא פעיל: בדוק שהשרת הופעל מחדש אחרי הוספת ה-.env
- אם יש שגיאה ב-redirect: ודא שה-redirect URI תואם בדיוק (כולל http/https)
- אם יש שגיאת "redirect_uri_mismatch": ודא שה-URI ב-Google Console תואם בדיוק
