import { AuthService } from '@/lib/services/AuthService';
import { getAuthSession } from '@/lib/auth-helper';
import { prisma } from '@/lib/prisma';
import NewLogin from '@/components/auth/NewLogin';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Never cache this page

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
        // 1. Try to get from session (Google auth)
        try {
          const session = await getAuthSession();
          if (session?.user?.email) {
            const user = await prisma.user.findUnique({
              where: { email: session.user.email },
            });
            if (user) {
              redirect('/learn/path');
            }
          }
        } catch (sessionError) {
          // Continue to deviceId check
        }

        // 2. Try to get from deviceId (Anonymous)
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
