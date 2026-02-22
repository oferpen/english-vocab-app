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
        if (deviceId) {
          const user = await AuthService.findUserByDeviceId(deviceId);
          
          if (user) {
            redirect('/learn/path');
          }
        }
      } catch (authError: any) {
        // If it's a redirect error, rethrow it
        if (authError?.message?.includes('NEXT_REDIRECT')) {
          throw authError;
        }
        // Log error for debugging but don't crash
        console.error('[Home] Auth check error:', authError?.message);
        // Continue to show login screen
      }
    }

    // Show login screen
    return <NewLogin />;
  } catch (error: any) {
    // If redirect throws (which is expected), let it propagate
    if (error?.message?.includes('NEXT_REDIRECT')) {
      throw error;
    }
    // Log error for debugging
    console.error('[Home] Error:', error?.message);
    // For any other errors, show login screen
    return <NewLogin />;
  }
}
