'use client';

import { SessionProvider } from 'next-auth/react';

export default function Providers({ children }: { children: React.ReactNode }) {
  try {
    return (
      <SessionProvider>
        {children}
      </SessionProvider>
    );
  } catch (error) {
    // Fallback if SessionProvider fails
    return <>{children}</>;
  }
}
