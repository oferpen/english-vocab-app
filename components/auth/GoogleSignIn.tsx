'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';

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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-purple-50 to-pink-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 max-w-md w-full text-center relative z-10 border border-gray-100">
        {/* App Logo/Icon */}
        <div className="mb-6">
          <div className="text-7xl mb-4 animate-bounce-slow-icon">📚</div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
            לימוד אנגלית
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            למד אנגלית בדרך מהנה ואינטראקטיבית
          </p>
        </div>

        {/* Feature Preview */}
        <div className="mb-8 grid grid-cols-3 gap-4 text-sm">
          <div className="flex flex-col items-center p-3 bg-primary-50 rounded-xl">
            <span className="text-2xl mb-2">🎯</span>
            <span className="text-gray-700 font-medium">מילים</span>
            <span className="text-xs text-gray-500 mt-1">מאות מילים</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-purple-50 rounded-xl">
            <span className="text-2xl mb-2">⭐</span>
            <span className="text-gray-700 font-medium">רמות</span>
            <span className="text-xs text-gray-500 mt-1">3 רמות</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-pink-50 rounded-xl">
            <span className="text-2xl mb-2">🏆</span>
            <span className="text-gray-700 font-medium">חידונים</span>
            <span className="text-xs text-gray-500 mt-1">בדוק את עצמך</span>
          </div>
        </div>

        {/* Sign In Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            console.log('[GoogleSignIn] Button clicked');
            handleGoogleSignIn();
          }}
          onKeyDown={handleKeyPress}
          disabled={isLoading}
          type="button"
          aria-label="התחבר עם Google כדי להתחיל ללמוד אנגלית"
          className="w-full flex items-center justify-center gap-3 p-4 md:p-5 border-2 border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] bg-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-lg font-medium text-gray-700">מתחבר...</span>
            </>
          ) : (
            <>
              <svg className="w-6 h-6" viewBox="0 0 24 24" aria-hidden="true">
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
              <span className="text-lg font-semibold text-gray-700">התחבר עם Google</span>
            </>
          )}
        </button>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm animate-slide-down" role="alert">
            {error}
          </div>
        )}

        {/* Trust & Security */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>התחברות מאובטחת</span>
          </div>
          <p className="text-xs text-gray-400">
            המידע שלך מוגן ופרטי. אנו משתמשים רק במידע הדרוש ליצירת הפרופיל.
          </p>
        </div>
      </div>

    </div>
  );
}
