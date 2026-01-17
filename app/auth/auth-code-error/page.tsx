import Link from 'next/link';

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold mb-4">שגיאה בהתחברות</h1>
        <p className="text-gray-600 mb-6">
          הייתה בעיה בתהליך ההתחברות. אנא נסה שוב.
        </p>
        <Link
          href="/parent"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          חזור לדף ההתחברות
        </Link>
      </div>
    </div>
  );
}
