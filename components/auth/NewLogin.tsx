'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Rocket } from 'lucide-react';

export default function NewLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAnonymousLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Call the new login API endpoint
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Prevent caching
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Login failed' }));
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Login failed');
      }

      // Login successful - wait a moment for cookie to be set
      await new Promise(resolve => setTimeout(resolve, 300));

      // Use window.location for a full page reload to ensure cookie is processed
      window.location.href = '/learn/path';
    } catch (err: any) {
      console.error('[NewLogin] Error:', err);
      setError(err?.message || 'שגיאה בהתחברות. נסה שוב.');
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setError(null);
      
      // Use redirect: false to handle errors properly
      const result = await signIn('google', {
        callbackUrl: '/learn/path',
        redirect: false,
      });
      
      if (result?.error) {
        console.error('Google sign-in error:', result.error);
        setError(`שגיאה בהתחברות: ${result.error}`);
        setIsGoogleLoading(false);
      } else if (result?.ok) {
        // Success - redirect manually
        window.location.href = '/learn/path';
      } else {
        // Still processing or pending
        setIsGoogleLoading(false);
      }
    } catch (err: any) {
      console.error('Google sign-in exception:', err);
      setError(`שגיאה בהתחברות: ${err?.message || 'אירעה שגיאה. נסה שוב.'}`);
      setIsGoogleLoading(false);
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
          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading}
            className="w-full bg-neutral-100 border border-neutral-200 text-neutral-800 px-6 py-4 rounded-2xl font-medium text-lg hover:bg-neutral-50 transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-neutral-600" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>כניסה עם גוגל</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-neutral-200"></span>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-neutral-500 font-medium text-sm">או</span>
            </div>
          </div>

          {/* Anonymous Login Button */}
          <button
            onClick={handleAnonymousLogin}
            disabled={isLoading || isGoogleLoading}
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
