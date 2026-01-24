'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SessionChecker() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
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
  }, [session, status, router, hasChecked]);

  // Show loading state while checking session
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">מתחבר...</p>
      </div>
    </div>
  );
}
