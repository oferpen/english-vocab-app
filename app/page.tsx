import { getCurrentChild } from '@/lib/auth-nextauth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import CreateChildProfile from '@/components/CreateChildProfile';
import SessionChecker from '@/components/auth/SessionChecker';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Home() {
  try {
    const session = await getServerSession(authOptions);
    
    // If not logged in, show sign-in screen with session checker
    // Session checker will handle redirect after Google login when session cookie is set
    if (!session?.user?.email) {
      return (
        <>
          <GoogleSignIn />
          <SessionChecker />
        </>
      );
    }

    // If logged in, check for child profile
    const child = await getCurrentChild();

    // If logged in but no child profile, show creation screen
    if (!child) {
      return <CreateChildProfile />;
    }

    // If logged in with child, skip welcome screen and redirect to learning path
    redirect('/learn/path');
  } catch (error: any) {
    // If redirect throws (which is expected), let it propagate
    if (error?.message?.includes('NEXT_REDIRECT')) {
      throw error;
    }
    // For other errors, show sign-in screen
    return (
      <>
        <GoogleSignIn />
        <SessionChecker />
      </>
    );
  }
}
