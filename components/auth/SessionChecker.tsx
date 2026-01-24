'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SessionChecker() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [hasChecked, setHasChecked] = useState(false);
  
  // Only run on home page
  const isHomePage = pathname === '/';

  useEffect(() => {
    // Only run on home page
    if (!isHomePage) {
      return;
    }

    // Wait for session to be loaded
    if (status === 'loading') {
      return; // Still loading
    }

    // If we've already checked, don't check again
    if (hasChecked) {
      return;
    }

    // If session exists, redirect to learn path
    if (status === 'authenticated' && session?.user?.email) {
      setHasChecked(true);
      // Small delay to ensure session cookie is fully set
      setTimeout(() => {
        router.replace('/learn/path');
      }, 100);
    } else if (status === 'unauthenticated') {
      // If no session after loading, wait a bit and check again
      // This handles the case where the cookie is being set after OAuth redirect
      const timeoutId = setTimeout(() => {
        if (!hasChecked) {
          setHasChecked(true);
          // Refresh the page to check session again (server-side will have the cookie)
          window.location.reload();
        }
      }, 1000); // Wait 1 second for cookie to be set
      
      return () => clearTimeout(timeoutId);
    }
  }, [session, status, router, hasChecked, isHomePage]);

  // Only show loading overlay if we're on home page and checking session
  if (!isHomePage || hasChecked || status === 'authenticated') {
    return null;
  }

  // Show subtle loading indicator (don't block the UI completely)
  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-3 z-50 border border-gray-200">
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
        <p className="text-sm text-gray-600">בודק התחברות...</p>
      </div>
    </div>
  );
}
