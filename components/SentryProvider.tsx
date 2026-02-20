'use client';

import { useEffect } from 'react';

export default function SentryProvider() {
  useEffect(() => {
    // Only import Sentry on the client side
    if (typeof window !== 'undefined') {
      import('../sentry.client.config');
    }
  }, []);

  return null;
}
