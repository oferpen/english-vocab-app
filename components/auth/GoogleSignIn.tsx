'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Rocket } from 'lucide-react';

export default function GoogleSignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Component mounted
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signIn('google', {
        callbackUrl: '/',
        redirect: true,
      });
    } catch (err: any) {
      console.error('[GoogleSignIn] Error during sign in:', err);
      setError(`שגיאה בהתחברות: ${err?.message || 'אירעה שגיאה. נסה שוב.'}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-100/50 rounded-full blur-[120px] pointer-events-none animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-100/50 rounded-full blur-[120px] pointer-events-none animate-blob animation-delay-2000"></div>

      <div className="bg-white rounded-[3rem] shadow-2xl p-10 md:p-14 max-w-md w-full text-center relative z-10 border-4 border-primary-100 card-kids">
        {/* App Logo/Icon */}
        <div className="mb-10 flex flex-col items-center">
          <div className="relative mb-6">
            <div className="w-24 h-24 bg-primary-50 rounded-[2rem] flex items-center justify-center transform rotate-6 shadow-md border-2 border-primary-100">
              <span className="text-6xl transform -rotate-6">🦉</span>
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-accent-100 rounded-xl flex items-center justify-center border-2 border-white shadow-lg">
              <span className="text-xl">✨</span>
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl font-black text-primary-600 mb-4 tracking-tight">
            EnglishPath
          </h1>
          <p className="text-xl text-neutral-600 font-bold leading-relaxed max-w-xs mx-auto">
            הצטרפו להרפתקה של פעם בחיים וגלו את עולם האנגלית!
          </p>
        </div>

        <div className="space-y-6">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-white border-4 border-neutral-100 text-neutral-700 px-8 py-5 rounded-[2rem] font-bold text-xl hover:border-primary-200 hover:bg-neutral-50 transition-all flex items-center justify-center gap-4 shadow-sm btn-bubbly"
          >
            <img src="/google-logo.svg" alt="Google" className="w-6 h-6" />
            <span>כניסה עם גוגל</span>
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t-4 border-neutral-50"></span>
            </div>
            <div className="relative flex justify-center text-sm uppercase">
              <span className="bg-white px-6 text-neutral-400 font-black tracking-widest text-xs">או</span>
            </div>
          </div>

          <button
            onClick={async () => {
              setIsLoading(true);
              setError(null);
              try {
                const { startAnonymousSession } = await import('@/app/actions/auth');
                await startAnonymousSession();
              } catch (err: any) {
                if (err.message?.includes('NEXT_REDIRECT')) {
                  throw err;
                }
                setIsLoading(false);
                setError('אירעה שגיאה. נסה שוב.');
              }
            }}
            disabled={isLoading}
            className="w-full bg-accent-500 hover:bg-accent-600 text-neutral-900 px-8 py-6 rounded-[2rem] font-black text-2xl shadow-xl shadow-accent-500/30 transition-all flex items-center justify-center gap-4 group btn-bubbly"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900" />
            ) : (
              <>
                <Rocket className="w-10 h-10 group-hover:animate-bounce-slow" />
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
          <div className="pt-8 mt-4 border-t-2 border-neutral-50 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-neutral-400 font-black text-xs uppercase tracking-widest">
              <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              הרפתקה בטוחה ומאובטחת
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
