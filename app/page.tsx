import { getCurrentChild } from '@/lib/auth-nextauth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import WelcomeScreen from '@/components/WelcomeScreen';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import CreateChildProfile from '@/components/CreateChildProfile';
import { getLevelState } from '@/app/actions/levels';
import { getStreak } from '@/app/actions/streak';

export const dynamic = 'force-dynamic';

export default async function Home() {
  try {
    const session = await getServerSession(authOptions);
    const child = await getCurrentChild();

    console.log('[Home] Session:', session?.user?.email ? 'Logged in' : 'Not logged in');
    console.log('[Home] Child:', child ? `Found: ${child.name}` : 'No child');

    // If not logged in, show sign-in screen
    if (!session?.user?.email) {
      return <GoogleSignIn />;
    }

    // If logged in but no child profile, show creation screen
    if (!child) {
      console.log('[Home] Showing CreateChildProfile screen');
      return <CreateChildProfile />;
    }

    // Fetch level and streak with error handling
    let levelState = null;
    let streak = 0;
    
    try {
      levelState = await getLevelState(child.id);
    } catch (error) {
      console.error('Error fetching level state:', error);
    }
    
    try {
      streak = await getStreak(child.id) || 0;
    } catch (error) {
      console.error('Error fetching streak:', error);
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <WelcomeScreen 
          childName={child.name}
          avatar={child.avatar || undefined}
          level={levelState?.level || 1}
          streak={streak}
          isParentLoggedIn={true}
          showProgress={true}
          currentChildId={child.id}
        />
      </div>
    );
  } catch (error) {
    console.error('Error in Home page:', error);
    // Show login screen on any error
    return <GoogleSignIn />;
  }
}
