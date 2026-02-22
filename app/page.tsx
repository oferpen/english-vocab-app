import { getCurrentUser } from '@/lib/auth';
import SimpleLogin from '@/components/auth/SimpleLogin';
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

    // If not explicitly logged out, check if user exists
    if (!isLoggedOut) {
      try {
        const user = await getCurrentUser();
        if (user) {
          redirect('/learn/path');
        }
      } catch (authError: any) {
        // If it's a redirect error, rethrow it
        if (authError?.message?.includes('NEXT_REDIRECT')) {
          throw authError;
        }
        // Otherwise, just show login screen
      }
    }

    // Show login screen
    return <SimpleLogin />;
  } catch (error: any) {
    // If redirect throws (which is expected), let it propagate
    if (error?.message?.includes('NEXT_REDIRECT')) {
      throw error;
    }
    // For any other errors, show login screen
    return <SimpleLogin />;
  }
}
