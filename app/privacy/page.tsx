import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy - English Path',
  description: 'Privacy Policy for English Path - English vocabulary learning app',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <h1 className="text-4xl font-black text-primary-600 mb-2">English Path</h1>
          </Link>
          <h2 className="text-3xl font-bold text-neutral-800 mb-2">מדיניות פרטיות</h2>
          <h2 className="text-2xl font-semibold text-neutral-600">Privacy Policy</h2>
          <p className="text-sm text-neutral-500 mt-2">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Content */}
        <div className="glass-premium rounded-3xl p-6 sm:p-8 md:p-12 space-y-8">
          
          {/* Introduction */}
          <section>
            <h3 className="text-2xl font-bold text-neutral-800 mb-4" dir="rtl">1. מבוא / Introduction</h3>
            <div className="space-y-4 text-neutral-700" dir="rtl">
              <p>
                אפליקציית English Path ("האפליקציה", "אנחנו", "שלנו") מחויבת להגנה על הפרטיות שלכם. מדיניות פרטיות זו מסבירה אילו מידע אנו אוספים, כיצד אנו משתמשים בו, ומהן זכויותיכם.
              </p>
            </div>
            <div className="space-y-4 text-neutral-700 mt-4" dir="ltr">
              <p>
                English Path ("the App", "we", "our") is committed to protecting your privacy. This Privacy Policy explains what information we collect, how we use it, and what your rights are.
              </p>
            </div>
          </section>

          {/* Information We Collect */}
          <section>
            <h3 className="text-2xl font-bold text-neutral-800 mb-4" dir="rtl">2. מידע שאנו אוספים / Information We Collect</h3>
            
            <h4 className="text-xl font-semibold text-neutral-700 mb-3 mt-6" dir="rtl">2.1 מידע אישי / Personal Information</h4>
            <div className="space-y-2 text-neutral-700" dir="rtl">
              <p>אם תבחרו להתחבר באמצעות Google:</p>
              <ul className="list-disc list-inside space-y-1 mr-4">
                <li>כתובת אימייל</li>
                <li>שם</li>
                <li>תמונת פרופיל</li>
                <li>מזהה Google (Google ID)</li>
              </ul>
            </div>
            <div className="space-y-2 text-neutral-700 mt-4" dir="ltr">
              <p>If you choose to sign in with Google:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Email address</li>
                <li>Name</li>
                <li>Profile picture</li>
                <li>Google ID</li>
              </ul>
            </div>

            <h4 className="text-xl font-semibold text-neutral-700 mb-3 mt-6" dir="rtl">2.2 מידע שימוש / Usage Information</h4>
            <div className="space-y-2 text-neutral-700" dir="rtl">
              <p>אנו אוספים מידע על השימוש שלכם באפליקציה:</p>
              <ul className="list-disc list-inside space-y-1 mr-4">
                <li>התקדמות למידה (מילים ואותיות שנלמדו)</li>
                <li>תוצאות חידונים</li>
                <li>נקודות נסיון (XP) ורמה</li>
                <li>סטטיסטיקות למידה (זמנים שנלמדו, מילים שנראו)</li>
                <li>מצב משימות יומיות ושבועיות</li>
                <li>רצף ימים (streak)</li>
              </ul>
            </div>
            <div className="space-y-2 text-neutral-700 mt-4" dir="ltr">
              <p>We collect information about your use of the app:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Learning progress (words and letters learned)</li>
                <li>Quiz results</li>
                <li>Experience points (XP) and level</li>
                <li>Learning statistics (times learned, words seen)</li>
                <li>Daily and weekly mission status</li>
                <li>Streak (consecutive days)</li>
              </ul>
            </div>

            <h4 className="text-xl font-semibold text-neutral-700 mb-3 mt-6" dir="rtl">2.3 מידע טכני / Technical Information</h4>
            <div className="space-y-2 text-neutral-700" dir="rtl">
              <ul className="list-disc list-inside space-y-1 mr-4">
                <li>מזהה מכשיר (Device ID) - עבור משתמשים אנונימיים</li>
                <li>סוג מכשיר ודפדפן</li>
                <li>כתובת IP (נשמרת באופן זמני על ידי ספק השירותים שלנו)</li>
              </ul>
            </div>
            <div className="space-y-2 text-neutral-700 mt-4" dir="ltr">
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Device ID - for anonymous users</li>
                <li>Device type and browser</li>
                <li>IP address (temporarily stored by our service provider)</li>
              </ul>
            </div>
          </section>

          {/* How We Use Information */}
          <section>
            <h3 className="text-2xl font-bold text-neutral-800 mb-4" dir="rtl">3. כיצד אנו משתמשים במידע / How We Use Information</h3>
            <div className="space-y-2 text-neutral-700" dir="rtl">
              <p>אנו משתמשים במידע שנאסף כדי:</p>
              <ul className="list-disc list-inside space-y-1 mr-4">
                <li>לספק ולשפר את השירותים שלנו</li>
                <li>לעקוב אחר ההתקדמות שלכם בלמידה</li>
                <li>להתאים אישית את חוויית הלמידה</li>
                <li>לחשב נקודות נסיון ורמות</li>
                <li>לשמור על רצף ימים (streak)</li>
                <li>לספק משימות יומיות ושבועיות</li>
                <li>לשמור על אבטחת האפליקציה</li>
              </ul>
            </div>
            <div className="space-y-2 text-neutral-700 mt-4" dir="ltr">
              <p>We use the collected information to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Provide and improve our services</li>
                <li>Track your learning progress</li>
                <li>Personalize your learning experience</li>
                <li>Calculate experience points and levels</li>
                <li>Maintain your streak (consecutive days)</li>
                <li>Provide daily and weekly missions</li>
                <li>Maintain app security</li>
              </ul>
            </div>
          </section>

          {/* Data Storage */}
          <section>
            <h3 className="text-2xl font-bold text-neutral-800 mb-4" dir="rtl">4. אחסון נתונים / Data Storage</h3>
            <div className="space-y-2 text-neutral-700" dir="rtl">
              <p>
                הנתונים שלכם נשמרים במסד נתונים PostgreSQL המאוחסן על ידי Vercel (ספק שירותי ענן). 
                המידע מוצפן ומאובטח בהתאם לתקני התעשייה.
              </p>
            </div>
            <div className="space-y-2 text-neutral-700 mt-4" dir="ltr">
              <p>
                Your data is stored in a PostgreSQL database hosted by Vercel (cloud service provider). 
                Information is encrypted and secured according to industry standards.
              </p>
            </div>
          </section>

          {/* Third-Party Services */}
          <section>
            <h3 className="text-2xl font-bold text-neutral-800 mb-4" dir="rtl">5. שירותים של צד שלישי / Third-Party Services</h3>
            <div className="space-y-2 text-neutral-700" dir="rtl">
              <p>אנו משתמשים בשירותים הבאים:</p>
              <ul className="list-disc list-inside space-y-1 mr-4">
                <li><strong>Google Sign-In:</strong> לאימות משתמשים. כניסה באמצעות Google כפופה למדיניות הפרטיות של Google.</li>
                <li><strong>Vercel:</strong> לאירוח האפליקציה ומסד הנתונים. כפוף למדיניות הפרטיות של Vercel.</li>
                <li><strong>NextAuth.js:</strong> לניהול אימות משתמשים.</li>
              </ul>
            </div>
            <div className="space-y-2 text-neutral-700 mt-4" dir="ltr">
              <p>We use the following services:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Google Sign-In:</strong> For user authentication. Signing in with Google is subject to Google's Privacy Policy.</li>
                <li><strong>Vercel:</strong> For hosting the app and database. Subject to Vercel's Privacy Policy.</li>
                <li><strong>NextAuth.js:</strong> For managing user authentication.</li>
              </ul>
            </div>
          </section>

          {/* Cookies and Local Storage */}
          <section>
            <h3 className="text-2xl font-bold text-neutral-800 mb-4" dir="rtl">6. עוגיות ואחסון מקומי / Cookies and Local Storage</h3>
            <div className="space-y-2 text-neutral-700" dir="rtl">
              <p>
                האפליקציה משתמשת בעוגיות ובאחסון מקומי (localStorage) כדי לשמור על מצב ההתחברות שלכם 
                ולשפר את חוויית השימוש. ניתן למחוק עוגיות דרך הגדרות הדפדפן שלכם.
              </p>
            </div>
            <div className="space-y-2 text-neutral-700 mt-4" dir="ltr">
              <p>
                The app uses cookies and local storage to maintain your login state and improve your experience. 
                You can delete cookies through your browser settings.
              </p>
            </div>
          </section>

          {/* Children's Privacy */}
          <section>
            <h3 className="text-2xl font-bold text-neutral-800 mb-4" dir="rtl">7. פרטיות ילדים / Children's Privacy</h3>
            <div className="space-y-2 text-neutral-700" dir="rtl">
              <p>
                האפליקציה מיועדת לילדים ומבוגרים כאחד. אם ילדכם משתמש באפליקציה, 
                אנו ממליצים לכם לפקח על השימוש שלהם ולסייע להם בהבנת מדיניות פרטיות זו.
              </p>
              <p>
                אנו לא אוספים בכוונה מידע אישי מילדים מתחת לגיל 13 ללא הסכמת הורים. 
                אם אתם הורים ומעוניינים למחוק את המידע של ילדכם, אנא צרו איתנו קשר.
              </p>
            </div>
            <div className="space-y-2 text-neutral-700 mt-4" dir="ltr">
              <p>
                The app is designed for both children and adults. If your child uses the app, 
                we recommend that you monitor their usage and help them understand this privacy policy.
              </p>
              <p>
                We do not knowingly collect personal information from children under 13 without parental consent. 
                If you are a parent and wish to delete your child's information, please contact us.
              </p>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <h3 className="text-2xl font-bold text-neutral-800 mb-4" dir="rtl">8. זכויותיכם / Your Rights</h3>
            <div className="space-y-2 text-neutral-700" dir="rtl">
              <p>יש לכם את הזכויות הבאות:</p>
              <ul className="list-disc list-inside space-y-1 mr-4">
                <li><strong>גישה:</strong> לבקש לראות את המידע שיש לנו עליכם</li>
                <li><strong>מחיקה:</strong> לבקש למחוק את המידע שלכם</li>
                <li><strong>תיקון:</strong> לבקש לתקן מידע שגוי</li>
                <li><strong>התנגדות:</strong> להתנגד לעיבוד המידע שלכם</li>
              </ul>
              <p className="mt-4">
                כדי לממש את זכויותיכם, אנא צרו איתנו קשר בכתובת האימייל שלהלן.
              </p>
            </div>
            <div className="space-y-2 text-neutral-700 mt-4" dir="ltr">
              <p>You have the following rights:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Access:</strong> Request to see the information we have about you</li>
                <li><strong>Deletion:</strong> Request to delete your information</li>
                <li><strong>Correction:</strong> Request to correct inaccurate information</li>
                <li><strong>Objection:</strong> Object to processing your information</li>
              </ul>
              <p className="mt-4">
                To exercise your rights, please contact us at the email address below.
              </p>
            </div>
          </section>

          {/* Data Security */}
          <section>
            <h3 className="text-2xl font-bold text-neutral-800 mb-4" dir="rtl">9. אבטחת נתונים / Data Security</h3>
            <div className="space-y-2 text-neutral-700" dir="rtl">
              <p>
                אנו נוקטים באמצעי אבטחה מתאימים כדי להגן על המידע שלכם מפני גישה לא מורשית, 
                שינוי, חשיפה או השמדה. עם זאת, אין שיטה של שידור או אחסון אלקטרוני שהיא מאובטחת לחלוטין.
              </p>
            </div>
            <div className="space-y-2 text-neutral-700 mt-4" dir="ltr">
              <p>
                We take appropriate security measures to protect your information from unauthorized access, 
                alteration, disclosure, or destruction. However, no method of electronic transmission or storage is completely secure.
              </p>
            </div>
          </section>

          {/* Changes to Privacy Policy */}
          <section>
            <h3 className="text-2xl font-bold text-neutral-800 mb-4" dir="rtl">10. שינויים במדיניות הפרטיות / Changes to Privacy Policy</h3>
            <div className="space-y-2 text-neutral-700" dir="rtl">
              <p>
                אנו עשויים לעדכן את מדיניות פרטיות זו מעת לעת. נציין את התאריך של העדכון האחרון 
                בראש העמוד. אנו ממליצים לכם לבדוק את מדיניות פרטיות זו מעת לעת.
              </p>
            </div>
            <div className="space-y-2 text-neutral-700 mt-4" dir="ltr">
              <p>
                We may update this Privacy Policy from time to time. We will indicate the date of the last update 
                at the top of this page. We recommend that you review this Privacy Policy periodically.
              </p>
            </div>
          </section>

          {/* Contact Information */}
          <section>
            <h3 className="text-2xl font-bold text-neutral-800 mb-4" dir="rtl">11. יצירת קשר / Contact Information</h3>
            <div className="space-y-2 text-neutral-700" dir="rtl">
              <p>
                אם יש לכם שאלות או בקשות לגבי מדיניות פרטיות זו, אנא צרו איתנו קשר:
              </p>
              <p className="font-semibold mt-4">
                אימייל: <a href="mailto:oferpen@gmail.com" className="text-primary-600 hover:underline">oferpen@gmail.com</a>
              </p>
            </div>
            <div className="space-y-2 text-neutral-700 mt-4" dir="ltr">
              <p>
                If you have questions or requests regarding this Privacy Policy, please contact us:
              </p>
              <p className="font-semibold mt-4">
                Email: <a href="mailto:oferpen@gmail.com" className="text-primary-600 hover:underline">oferpen@gmail.com</a>
              </p>
            </div>
          </section>

          {/* Back to Home */}
          <div className="mt-12 pt-8 border-t border-white/20 text-center">
            <Link 
              href="/" 
              className="inline-block px-8 py-4 bg-primary-500 text-white rounded-2xl font-bold shadow-lg hover:bg-primary-600 transition-colors"
            >
              חזרה לדף הבית / Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
