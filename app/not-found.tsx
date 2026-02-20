import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 - Page Not Found | English Path',
  description: 'Page not found',
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl sm:text-8xl font-black text-white mb-4">404</h1>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4" dir="rtl">
          הדף לא נמצא
        </h2>
        <p className="text-xl text-white/90 mb-2" dir="rtl">
          This page could not be found
        </p>
        <p className="text-lg text-white/80 mb-8" dir="rtl">
          הדף שחיפשת לא קיים או הועבר למיקום אחר
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-4 bg-white text-primary-600 rounded-2xl font-bold shadow-lg hover:bg-white/90 transition-colors text-lg"
        >
          חזרה לדף הבית / Back to Home
        </Link>
      </div>
    </div>
  );
}
