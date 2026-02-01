import { getCurrentChild, initAnonymousAccount } from '@/lib/auth-nextauth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import CreateChildProfile from '@/components/CreateChildProfile';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ loggedOut?: string }>;
}) {
  try {
    const params = await searchParams;
    const isLoggedOut = params.loggedOut === 'true';

    const session = await getServerSession(authOptions);
    const cookieStore = await cookies();
    const deviceId = cookieStore.get('deviceId')?.value;

    // 1. If logged in with Google, check for child profile
    if (session?.user?.email && !isLoggedOut) {
      const child = await getCurrentChild();
      if (!child) {
        return <CreateChildProfile />;
      }
      redirect('/learn/path');
    }

    // 2. If not logged in but has deviceId, try anonymous entry
    // SKIP this if the user just explicitly logged out
    if (deviceId && !isLoggedOut) {
      // Initialize anonymous account if it doesn't exist
      const parentResult = await initAnonymousAccount(deviceId);

      // If parentResult is null, it means this deviceId belongs to a non-anonymous account.
      // We fall back to standard sign-in.
      if (parentResult) {
        const child = await getCurrentChild();
        if (child) {
          redirect('/learn/path');
        }
      }
    }

    // 3. Fallback: Show sign-in screen
    return <GoogleSignIn />;
  } catch (error: any) {
    // If redirect throws (which is expected), let it propagate
    if (error?.message?.includes('NEXT_REDIRECT')) {
      throw error;
    }
    // For other errors, show sign-in screen
    console.error('Error in Home page:', error);
    return <GoogleSignIn />;
  }
}
