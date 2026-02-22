import { getCurrentUser } from '@/lib/auth';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ loggedOut?: string; justLoggedIn?: string }>;
}) {
  try {
    const params = await searchParams;
    const isLoggedOut = params.loggedOut === 'true';
    const justLoggedIn = params.justLoggedIn === '1';

    // If not explicitly logged out, check if user exists (Google or Anonymous)
    if (!isLoggedOut) {
      try {
        // If we just logged in, wait a moment for cookie to be available
        if (justLoggedIn) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        const user = await getCurrentUser();
        if (user) {
          redirect('/learn/path');
        } else if (justLoggedIn) {
          // If we just logged in but user not found, wait a bit more and retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          const retryUser = await getCurrentUser();
          if (retryUser) {
            redirect('/learn/path');
          }
        }
      } catch (authError: any) {
        // If auth check fails (including timeout), just show sign-in screen
        // Don't crash the homepage - this is a graceful fallback
        if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
          console.error('[Homepage] Auth check error:', authError?.message);
        }
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
    return <GoogleSignIn />;
  }
}
