'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SessionChecker() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hasChecked, setHasChecked] = useState(false);
  
  // Only show checker if we're coming from OAuth callback (has callbackUrl param)
  const isFromCallback = searchParams.get('callbackUrl') !== null;

  useEffect(() => {
    // Only run if we're coming from OAuth callback
    if (!isFromCallback) {
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
      // If no session after loading, check again after a short delay
      // This handles the case where the cookie is being set
      setTimeout(() => {
        if (!hasChecked) {
          setHasChecked(true);
          // Refresh the page to check session again
          window.location.reload();
        }
      }, 500);
    }
  }, [session, status, router, hasChecked, isFromCallback]);

  // Only show loading state if we're coming from callback
  if (!isFromCallback) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">מתחבר...</p>
      </div>
    </div>
  );
}
