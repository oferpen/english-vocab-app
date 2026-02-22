import { AuthService } from '@/lib/services/AuthService';
import NewLogin from '@/components/auth/NewLogin';
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
        const deviceId = await AuthService.getDeviceId();
        const user = await AuthService.findUserByDeviceId(deviceId);
        
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
    return <NewLogin />;
  } catch (error: any) {
    // If redirect throws (which is expected), let it propagate
    if (error?.message?.includes('NEXT_REDIRECT')) {
      throw error;
    }
    // For any other errors, show login screen
    return <NewLogin />;
  }
}
