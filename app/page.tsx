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
          if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
            console.log('[Homepage] deviceId from URL:', deviceIdFromUrl);
          }
          
          // Try direct database lookup first (bypass cookie timing issues)
          try {
            const { prisma } = await import('@/lib/prisma');
            const directUser = await Promise.race([
              prisma.user.findUnique({
                where: { deviceId: deviceIdFromUrl },
              }),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Direct lookup timeout')), 3000)
              )
            ]) as any;
            
            if (directUser) {
              if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
                console.log('[Homepage] Found user via direct lookup:', directUser.id);
              }
              redirect('/learn/path');
            } else {
              if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
                console.log('[Homepage] Direct lookup: no user found for deviceId:', deviceIdFromUrl);
              }
            }
          } catch (dbError: any) {
            if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
              console.error('[Homepage] Direct DB lookup error:', dbError?.message);
            }
          }
          
          // Wait for middleware to set cookie, then try getCurrentUser
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        let user = await getCurrentUser();
        
        if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
          console.log('[Homepage] getCurrentUser result:', user ? `found user ${user.id}` : 'not found');
        }
        
        // If deviceId was in URL but user not found, retry once more
        if (!user && deviceIdFromUrl) {
          await new Promise(resolve => setTimeout(resolve, 500));
          user = await getCurrentUser();
          if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
            console.log('[Homepage] Retry getCurrentUser result:', user ? `found user ${user.id}` : 'not found');
          }
        }
        
        if (user) {
          redirect('/learn/path');
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
