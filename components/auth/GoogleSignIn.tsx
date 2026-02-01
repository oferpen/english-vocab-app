'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function GoogleSignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Test if component is mounted and signIn is available
  useEffect(() => {
    console.log('[GoogleSignIn] Component mounted');
    console.log('[GoogleSignIn] signIn function available:', typeof signIn === 'function');
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('[GoogleSignIn] Attempting to sign in with Google...');

      // signIn redirects immediately on success, or returns { error: string } on failure
      // Redirect to home page first, which will handle session check and redirect to /learn/path
      // This ensures the session cookie is properly set before checking for child profile
      const result = await signIn('google', {
        callbackUrl: '/',
        redirect: true,
      });

      // If we get here and result has an error, show it
      if (result?.error) {
        console.error('[GoogleSignIn] Sign in error:', result.error);
        setError(`שגיאה בהתחברות: ${result.error}`);
        setIsLoading(false);
      } else {
        // signIn will redirect, so we won't reach here on success
        console.log('[GoogleSignIn] Sign in initiated, redirecting...');
      }
    } catch (err: any) {
      console.error('[GoogleSignIn] Error during sign in:', err);
      setError(`שגיאה בהתחברות: ${err?.message || 'אירעה שגיאה בהתחברות. נסה שוב.'}`);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleGoogleSignIn();
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9FF] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Subtle Background Decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-100/50 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] p-10 md:p-14 max-w-md w-full text-center relative z-10 border border-neutral-100">
        {/* App Logo/Icon */}
        <div className="mb-10 flex flex-col items-center">
          <div className="relative mb-6">
            <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center transform rotate-6 shadow-sm border border-indigo-100">
              <span className="text-6xl transform -rotate-6">📚</span>
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center border-2 border-white shadow-md">
              <span className="text-xl">✨</span>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-[900] text-indigo-600 mb-6 tracking-tight leading-tight">
            <Link href="/" className="hover:text-indigo-700 transition-colors cursor-pointer">
              EnglishPath
            </Link>
          </h1>
          <p className="text-lg text-neutral-500 font-bold tracking-tight">
            למד אנגלית בדרך מהנה ואינטראקטיבית
          </p>
        </div>

        {/* Feature Preview Grid */}
        <div className="mb-12 grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center p-4 bg-indigo-50/50 border border-indigo-100 rounded-3xl transition-transform hover:scale-105 duration-300">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3">
              <span className="text-2xl">🎯</span>
            </div>
            <span className="text-neutral-800 font-black text-sm">מילים</span>
            <span className="text-[10px] text-neutral-500 font-bold mt-1">מאות מילים</span>
          </div>

          <div className="flex flex-col items-center p-4 bg-indigo-50/50 border border-indigo-100 rounded-3xl transition-transform hover:scale-105 duration-300">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3">
              <span className="text-2xl">⭐</span>
            </div>
            <span className="text-neutral-800 font-black text-sm">רמות</span>
            <span className="text-[10px] text-neutral-500 font-bold mt-1">3 רמות</span>
          </div>

          <div className="flex flex-col items-center p-4 bg-indigo-50/50 border border-indigo-100 rounded-3xl transition-transform hover:scale-105 duration-300">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3">
              <span className="text-2xl">🏆</span>
            </div>
            <span className="text-neutral-800 font-black text-sm">חידונים</span>
            <span className="text-[10px] text-neutral-500 font-bold mt-1">בדוק את עצמך</span>
          </div>
        </div>

        {/* Main CTA: Anonymous Entry */}
        <div className="space-y-4 mb-8">
          <button
            onClick={async () => {
              setIsLoading(true);
              try {
                const { startAnonymousSession } = await import('@/app/actions/auth');
                await startAnonymousSession();
              } catch (err) {
                setIsLoading(false);
                setError('אירעה שגיאה. נסה שוב.');
              }
            }}
            disabled={isLoading}
            className="w-full py-6 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] shadow-[0_15px_30px_-5px_rgba(79,70,229,0.3)] transition-all duration-300 transform active:scale-[0.98] flex flex-col items-center justify-center gap-1 group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            <span className="text-2xl font-[900] relative z-10">🚀 התחל ללמוד</span>
            <span className="text-sm font-bold opacity-90 relative z-10">ללא הרשמה • גישה מיידית</span>
          </button>

          <div className="flex items-center gap-4 py-2">
            <div className="h-px bg-neutral-100 flex-1"></div>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">או</span>
            <div className="h-px bg-neutral-100 flex-1"></div>
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              handleGoogleSignIn();
            }}
            onKeyDown={handleKeyPress}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-4 py-4 px-6 border-2 border-neutral-100 rounded-2xl hover:border-indigo-200 hover:bg-indigo-50/50 transition-all duration-300 transform active:scale-[0.98] bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </div>
            <span className="text-lg font-black text-neutral-600">התחברות עם Google</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-bold animate-slide-down">
            {error}
          </div>
        )}

        {/* Trust Footer */}
        <div className="pt-6 border-t border-neutral-100 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-neutral-400 font-bold text-xs uppercase tracking-widest">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            התחברות מאובטחת
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed font-medium max-w-[280px]">
            המידע שלך מוגן ופרטי. אנו משתמשים רק במידע הדרוש ליצירת הפרופיל.
          </p>
        </div>
      </div>
    </div>
  );
}
