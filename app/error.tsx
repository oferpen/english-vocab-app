'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log error details for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    // Error details logged
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">שגיאה</h2>
        <p className="text-gray-700 mb-4">{error.message || 'אירעה שגיאה לא צפויה'}</p>
        {error.digest && (
          <p className="text-xs text-gray-500 mb-4">קוד שגיאה: {error.digest}</p>
        )}
        <div className="text-xs text-gray-400 mb-4 text-right">
          <p>בדוק את ה-logs ב-Vercel Dashboard לפרטים נוספים</p>
        </div>
        <button
          onClick={reset}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg"
        >
          נסה שוב
        </button>
        <div className="mt-4">
          <a href="/parent" className="text-blue-600 underline">
            חזור לפאנל הורים
          </a>
        </div>
      </div>
    </div>
  );
}
