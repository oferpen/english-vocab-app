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
      const user = await getCurrentUser();
      if (user) {
        redirect('/learn/path');
      }
    }

    // Otherwise show sign-in screen
    return <GoogleSignIn />;
  } catch (error: any) {
    // If redirect throws (which is expected), let it propagate
    if (error?.message?.includes('NEXT_REDIRECT')) {
      throw error;
    }
    // For other errors, show sign-in screen
    return <GoogleSignIn />;
  }
}
