'use client';

import { useEffect } from 'react';

export default function SentryProvider() {
  useEffect(() => {
    // Only import Sentry on the client side and if DSN is configured
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
      import('../sentry.client.config').catch((error) => {
        // Silently fail if Sentry initialization fails
        console.warn('Failed to initialize Sentry:', error);
      });
    }
  }, []);

  return null;
}
