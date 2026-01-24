'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

export default function SessionChecker() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [hasChecked, setHasChecked] = useState(false);
  const refreshAttempted = useRef(false);
  
  // Only run on home page
  const isHomePage = pathname === '/';
  
  // Check if we're coming from OAuth callback (NextAuth adds these params)
  const isFromOAuth = searchParams.has('error') || searchParams.has('code') || 
                       document.referrer.includes('accounts.google.com') ||
                       document.referrer.includes('oauth');

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
      // Only try refreshing once, and only if we're coming from OAuth
      if (isFromOAuth && !refreshAttempted.current) {
        refreshAttempted.current = true;
        setHasChecked(true);
        // Wait a bit for cookie to be set, then refresh once
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        // Not from OAuth or already refreshed - stop checking
        setHasChecked(true);
      }
    }
  }, [session, status, router, hasChecked, isHomePage, isFromOAuth]);

  // Don't show anything - let the server-side handle it
  return null;
}
