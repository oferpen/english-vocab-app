'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Rocket } from 'lucide-react';

export default function NewLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Call the new login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Login failed');
      }

      // Login successful - wait a moment for cookie to be set
      await new Promise(resolve => setTimeout(resolve, 200));

      // Redirect to learn path
      router.push('/learn/path');
      // Also force a refresh to ensure server components see the cookie
      router.refresh();
    } catch (err: any) {
      console.error('[NewLogin] Error:', err);
      setError(err?.message || 'שגיאה בהתחברות. נסה שוב.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-lg p-10 md:p-14 max-w-md w-full text-center">
        {/* App Logo/Icon */}
        <div className="mb-10 flex flex-col items-center">
          <div className="relative mb-6">
            <div className="w-24 h-24 bg-blue-100 rounded-[1.5rem] flex items-center justify-center shadow-sm">
              <span className="text-6xl">🦉</span>
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-orange-200 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-xl">✨</span>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-blue-600 mb-4 tracking-tight">
            EnglishPath
          </h1>
          <p className="text-lg md:text-xl text-neutral-700 font-medium leading-relaxed max-w-xs mx-auto">
            הצטרפו להרפתקה של פעם<br />בחיים וגלו את עולם האנגלית!
          </p>
        </div>

        <div className="space-y-5">
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-orange-400 hover:bg-orange-500 disabled:bg-orange-300 text-white px-6 py-5 rounded-2xl font-bold text-xl shadow-md transition-all flex items-center justify-center gap-3 group disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
            ) : (
              <>
                <Rocket className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                <span>התחל הרפתקה!</span>
              </>
            )}
          </button>

          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-100 rounded-2xl text-red-600 text-sm font-bold animate-slide-down">
              {error}
            </div>
          )}

          {/* Trust Footer */}
          <div className="pt-6 mt-4 flex flex-col items-center">
            <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              הרפתקה בטוחה ומאובטחת
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
