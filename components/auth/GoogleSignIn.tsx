'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Rocket } from 'lucide-react';

export default function GoogleSignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Clean up deviceId from URL if present (cookie should be set by now)
  // Also check if we're stuck in a loop
  useEffect(() => {
    const deviceId = searchParams.get('deviceId');
    if (deviceId && typeof window !== 'undefined') {
      // Check if we've been on this page with deviceId for more than 2 seconds
      // If so, something is wrong - try to redirect to clean URL
      const checkTimeout = setTimeout(() => {
        console.log('[GoogleSignIn] deviceId in URL for >2s, cleaning up URL to prevent loop');
        const url = new URL(window.location.href);
        url.searchParams.delete('deviceId');
        window.history.replaceState({}, '', url.toString());
        // Force a reload to check for user again
        window.location.reload();
      }, 2000);
      
      // Also clean up URL after 500ms normally
      const cleanupTimeout = setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete('deviceId');
        window.history.replaceState({}, '', url.toString());
      }, 500);
      
      return () => {
        clearTimeout(checkTimeout);
        clearTimeout(cleanupTimeout);
      };
    }
  }, [searchParams]);

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
            onClick={async () => {
              // Prevent double-clicks
              if (isLoading) {
                console.log('[Anonymous Login] Already loading, ignoring click');
                return;
              }
              
              setIsLoading(true);
              setError(null);
              
              // Safety timeout - always reset loading state after 15 seconds
              const safetyTimeout = setTimeout(() => {
                console.error('[Anonymous Login] Safety timeout - resetting button');
                setIsLoading(false);
                setError('הבקשה ארכה יותר מדי זמן. נסה לרענן את הדף.');
              }, 15000);
              
              try {
                console.log('[Anonymous Login] Starting...');
                const { startAnonymousSession } = await import('@/app/actions/auth');
                
                // Call server action with timeout
                const serverActionPromise = startAnonymousSession();
                const timeoutPromise = new Promise((resolve) => {
                  setTimeout(() => resolve({ success: false, timeout: true, error: 'Request timeout' }), 10000);
                });
                
                console.log('[Anonymous Login] Waiting for server action...');
                const result = await Promise.race([serverActionPromise, timeoutPromise]) as any;
                console.log('[Anonymous Login] Server action result:', result);
                
                // Clear safety timeout since we got a response
                clearTimeout(safetyTimeout);
                
                // Check if user was successfully created
                if (!result.success || !result.userCreated) {
                  const errorMsg = result.timeout ? 'הבקשה ארכה יותר מדי זמן' : (result.error || 'לא הצלחנו ליצור משתמש');
                  console.error('[Anonymous Login] Failed:', errorMsg, result);
                  setError(errorMsg);
                  setIsLoading(false);
                  return; // Don't redirect on failure
                }
                
                // User created successfully
                // The cookie should be set in the server action response
                // Redirect with deviceId in URL so middleware can use it if cookie isn't available yet
                const resultData = result as any;
                console.log('[Anonymous Login] User created, deviceId:', resultData.deviceId);
                
                // Check if deviceId is already in URL (prevent loops)
                const currentUrl = new URL(window.location.href);
                const existingDeviceId = currentUrl.searchParams.get('deviceId');
                
                if (existingDeviceId === resultData.deviceId) {
                  // Already have this deviceId in URL - we're in a loop
                  // Try redirecting directly to /learn/path since user should exist
                  console.log('[Anonymous Login] deviceId already in URL - possible loop, redirecting to /learn/path directly...');
                  window.location.href = '/learn/path';
                } else {
                  console.log('[Anonymous Login] Redirecting with deviceId in URL...');
                  // Redirect with deviceId as query param as fallback
                  // This ensures middleware can set the cookie even if it wasn't processed from the previous response
                  window.location.href = `/?deviceId=${resultData.deviceId}`;
                }
              } catch (err: any) {
                console.error('[Anonymous Login] Exception:', err);
                clearTimeout(safetyTimeout);
                setError(`שגיאה: ${err?.message || 'אירעה שגיאה. נסה שוב.'}`);
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
            className="w-full bg-orange-400 hover:bg-orange-500 text-white px-6 py-5 rounded-2xl font-bold text-xl shadow-md transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
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
