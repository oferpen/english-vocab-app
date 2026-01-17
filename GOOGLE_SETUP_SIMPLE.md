# הגדרת Google Login - מדריך פשוט

## שלב 1: צור OAuth Credentials ב-Google Cloud Console

1. **היכנס ל-[Google Cloud Console](https://console.cloud.google.com/)**

2. **צור פרויקט חדש:**
   - לחץ על תפריט הפרויקטים למעלה (ליד "Google Cloud")
   - לחץ "New Project"
   - תן שם (למשל: "English Vocab App")
   - לחץ "Create"

3. **הגדר OAuth Consent Screen (חובה בפעם הראשונה):**
   - בתפריט השמאלי, לחץ "APIs & Services" > "OAuth consent screen"
   - בחר "External" (או "Internal" אם יש לך Google Workspace)
   - לחץ "Create"
   - מלא את הפרטים:
     - **App name:** English Vocab App (או כל שם)
     - **User support email:** האימייל שלך
     - **Developer contact information:** האימייל שלך
   - לחץ "Save and Continue"
   - לחץ "Save and Continue" שוב (Scopes - לא צריך לשנות)
   - לחץ "Save and Continue" שוב (Test users - לא צריך להוסיף)
   - לחץ "Back to Dashboard"

4. **צור OAuth Client ID:**
   - לחץ "APIs & Services" > "Credentials"
   - לחץ "Create Credentials" > "OAuth client ID"
   - בחר "Web application"
   - תן שם: "English Vocab App Local" (או כל שם)
   - **Authorized redirect URIs** - לחץ "Add URI" והוסף:
     ```
     http://localhost:3000/api/auth/callback/google
     ```
   - לחץ "Create"
   - **חשוב:** העתק את ה-Client ID ו-Client Secret (תראה אותם רק פעם אחת!)

## שלב 2: הוסף ל-.env

פתח את קובץ `.env` והוסף:

```env
GOOGLE_CLIENT_ID=הדבק_כאן_את_ה-Client_ID_שהעתקת
GOOGLE_CLIENT_SECRET=הדבק_כאן_את_ה-Client_Secret_שהעתקת
NEXTAUTH_SECRET=Z2NvZ+7Cfvzc1APMEnknQC+T5+EmMM6PfHTLqXZhDBA=
NEXTAUTH_URL=http://localhost:3000
```

## שלב 3: הפעל מחדש

```bash
# עצור את השרת (Ctrl+C) והפעל מחדש:
npm run dev
```

## זה הכל!

עכשיו כפתור Google Login אמור להיות פעיל.

---

## הערות:

- **אין צורך להפעיל API ספציפי** - רק OAuth Consent Screen ו-Credentials
- אם אתה רוצה לראות את ה-Credentials שוב: "APIs & Services" > "Credentials" > לחץ על ה-Client ID שיצרת
- לפריסה ב-Vercel: הוסף את אותם משתנים ב-Vercel Dashboard > Settings > Environment Variables
