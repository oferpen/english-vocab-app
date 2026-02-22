import { getCurrentUser } from '@/lib/auth';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ loggedOut?: string; deviceId?: string }>;
}) {
  try {
    const params = await searchParams;
    const isLoggedOut = params.loggedOut === 'true';
    const deviceIdFromUrl = params.deviceId;

    // If not explicitly logged out, check if user exists (Google or Anonymous)
    if (!isLoggedOut) {
      try {
        // If deviceId is in URL, try to find user directly first
        if (deviceIdFromUrl) {
          console.log('[Homepage] deviceId from URL:', deviceIdFromUrl);
          
          // Try direct database lookup first (bypass cookie timing issues)
          try {
            const { prisma } = await import('@/lib/prisma');
            console.log('[Homepage] Starting direct DB lookup...');
            
            const directUser = await Promise.race([
              prisma.user.findUnique({
                where: { deviceId: deviceIdFromUrl },
              }),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Direct lookup timeout')), 5000)
              )
            ]) as any;
            
            console.log('[Homepage] Direct lookup result:', directUser ? `Found user ${directUser.id}` : 'No user found');
            
            if (directUser) {
              console.log('[Homepage] Redirecting to /learn/path');
              redirect('/learn/path'); // This throws NEXT_REDIRECT - will be caught by outer try-catch
            } else {
              console.log('[Homepage] No user found for deviceId, will try cookie lookup');
            }
          } catch (dbError: any) {
            // If it's a redirect error, rethrow it
            if (dbError?.message?.includes('NEXT_REDIRECT')) {
              throw dbError;
            }
            console.error('[Homepage] Direct DB lookup error:', dbError?.message, dbError);
          }
          
          // Wait for middleware to set cookie, then try getCurrentUser
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        let user = await getCurrentUser();
        
        console.log('[Homepage] getCurrentUser result:', user ? `found user ${user.id}` : 'not found');
        
        // If deviceId was in URL but user not found, retry once more
        if (!user && deviceIdFromUrl) {
          console.log('[Homepage] Retrying getCurrentUser...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          user = await getCurrentUser();
          console.log('[Homepage] Retry getCurrentUser result:', user ? `found user ${user.id}` : 'not found');
        }
        
        if (user) {
          console.log('[Homepage] User found, redirecting to /learn/path');
          redirect('/learn/path');
        } else {
          console.log('[Homepage] No user found, showing login screen');
        }
      } catch (authError: any) {
        // If it's a redirect error, rethrow it so Next.js can handle it
        if (authError?.message?.includes('NEXT_REDIRECT')) {
          throw authError;
        }
        // If auth check fails (including timeout), just show sign-in screen
        // Don't crash the homepage - this is a graceful fallback
        console.error('[Homepage] Auth check error:', authError?.message);
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
