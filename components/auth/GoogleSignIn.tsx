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
      
      console.log('Starting Google sign-in...');
      
      // Use redirect: false to handle errors properly
      const result = await signIn('google', {
        callbackUrl: '/',
        redirect: false,
      });
      
      console.log('Sign-in result:', result);
      
      if (result?.error) {
        console.error('Google sign-in error:', result.error);
        setError(`שגיאה בהתחברות: ${result.error}`);
        setIsLoading(false);
      } else if (result?.ok) {
        // Success - redirect manually
        console.log('Sign-in successful, redirecting...');
        window.location.href = '/';
      } else {
        // Still processing or pending
        console.log('Sign-in pending...');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Google sign-in exception:', err);
      setError(`שגיאה בהתחברות: ${err?.message || 'אירעה שגיאה. נסה שוב.'}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="bg-white rounded-[2.5rem] shadow-lg p-10 md:p-14 max-w-md w-full text-center relative z-10 border border-blue-100">
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
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-neutral-100 border border-neutral-200 text-neutral-800 px-6 py-4 rounded-2xl font-medium text-lg hover:bg-neutral-50 transition-all flex items-center justify-center gap-3 shadow-sm"
          >
            <img src="/google-logo.svg" alt="Google" className="w-5 h-5" />
            <span>כניסה עם גוגל</span>
          </button>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-neutral-200"></span>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-neutral-500 font-medium text-sm">או</span>
            </div>
          </div>

          <button
            onClick={async () => {
              // Prevent double-clicks
              if (isLoading) {
                console.log('[Anonymous Login] Already loading, ignoring click');
                return;
              }
              
              console.log('[Anonymous Login] Button clicked, starting login flow...');
              setIsLoading(true);
              setError(null);
              
              try {
                console.log('[Anonymous Login] Starting server action...');
                const { startAnonymousSession } = await import('@/app/actions/auth');
                
                // Wait for server action with timeout
                const serverActionPromise = startAnonymousSession();
                const timeoutPromise = new Promise((resolve) => {
                  setTimeout(() => resolve({ success: true, timeout: true }), 5000); // 5 second timeout
                });
                
                const result = await Promise.race([serverActionPromise, timeoutPromise]);
                console.log('[Anonymous Login] Server action completed, result:', result);
                
                const resultData = result as any;
                
                // If user wasn't created and it's not a timeout, try one more time
                if (!resultData?.userCreated && !resultData?.timeout) {
                  console.warn('[Anonymous Login] User was not created, retrying...');
                  // Wait a moment and try to verify user exists via API
                  await new Promise(resolve => setTimeout(resolve, 500));
                  try {
                    const verifyResponse = await fetch('/api/test-anon');
                    const verifyData = await verifyResponse.json();
                    console.log('[Anonymous Login] Verification result:', verifyData);
                    if (!verifyData.userFound) {
                      console.error('[Anonymous Login] User still not found after retry');
                      setError('לא הצלחנו ליצור משתמש. נסה לרענן את הדף.');
                      setIsLoading(false);
                      return; // Don't redirect if user creation failed
                    }
                  } catch (verifyError) {
                    console.error('[Anonymous Login] Verification failed:', verifyError);
                    // Continue with redirect anyway
                  }
                }
                
                // Wait a bit longer to ensure server response is fully processed
                // This gives time for cookies to be set in the response headers
                console.log('[Anonymous Login] Waiting 500ms for cookie to be set...');
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Redirect
                console.log('[Anonymous Login] Redirecting to homepage...');
                // Use window.location.replace to avoid back button issues
                window.location.replace('/');
              } catch (err: any) {
                console.error('[Anonymous Login] Exception caught:', err);
                setIsLoading(false); // Reset loading state on error
                setError(`שגיאה: ${err?.message || 'אירעה שגיאה. נסה שוב.'}`);
                // Even on error, redirect after a moment
                setTimeout(() => {
                  console.log('[Anonymous Login] Error occurred, redirecting anyway...');
                  window.location.replace('/');
                }, 1000);
              }
            }}
            disabled={isLoading}
            className="w-full bg-orange-400 hover:bg-orange-500 text-white px-6 py-5 rounded-2xl font-bold text-xl shadow-md transition-all flex items-center justify-center gap-3 group"
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
