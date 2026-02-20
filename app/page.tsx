import { getCurrentUser } from '@/lib/auth';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ loggedOut?: string }>;
}) {
  try {
    const params = await searchParams;
    const isLoggedOut = params.loggedOut === 'true';

    // If not explicitly logged out, check if user exists (Google or Anonymous)
    if (!isLoggedOut) {
      try {
        // Add timeout to prevent hanging
        const userPromise = getCurrentUser();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth check timeout')), 5000)
        );
        
        const user = await Promise.race([userPromise, timeoutPromise]) as Awaited<ReturnType<typeof getCurrentUser>> | null;
        
        if (user) {
          redirect('/learn/path');
        }
      } catch (authError: any) {
        // If auth check fails or times out, just show sign-in screen
        // Don't crash the homepage - this is a graceful fallback
        // Log in development only to avoid exposing errors in production
        if (process.env.NODE_ENV === 'development') {
          console.error('Auth check failed on homepage:', authError);
        }
        // Fall through to show GoogleSignIn
      }
    }

    // Show sign-in screen
    return <GoogleSignIn />;
  } catch (error: any) {
    // If redirect throws (which is expected), let it propagate
    if (error?.message?.includes('NEXT_REDIRECT')) {
      throw error;
    }
    // For any other errors, show sign-in screen (don't crash)
    // Log in development only
    if (process.env.NODE_ENV === 'development') {
      console.error('Homepage error:', error);
    }
    return <GoogleSignIn />;
  }
}
