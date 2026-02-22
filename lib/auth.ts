import { prisma } from './prisma';
import { getAuthSession } from './auth-helper';
import { User } from '@prisma/client';

export async function getCurrentUser(): Promise<User | null> {
  // Add timeout wrapper to prevent hanging
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('getCurrentUser timeout')), 3000); // 3 second timeout
  });

  try {
    const userPromise = (async () => {
      // 1. Try to get from session (Google auth)
      try {
        const session = await getAuthSession();
        if (session?.user?.email) {
          const user = await prisma.user.findUnique({
            where: { email: session.user.email },
          });
          if (user) return user;
        }
      } catch (sessionError) {
        // If session check fails, continue to deviceId check
        if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
          console.error('getCurrentUser - session error:', sessionError);
        }
      }

      // 2. Try to get from deviceId (Anonymous)
      try {
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();
        const deviceId = cookieStore.get('deviceId')?.value;
        if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
          console.log('[getCurrentUser] deviceId from cookie:', deviceId ? 'found' : 'not found');
        }
        if (deviceId) {
          const user = await prisma.user.findUnique({
            where: { deviceId },
          });
          if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
            console.log('[getCurrentUser] User lookup result:', user ? `found user ${user.id}` : 'not found');
          }
          // Allow device-based login for anonymous users or valid google users who are just not in session yet (though session check above handles that usually)
          // Actually, for pure anonymous access, we mostly care about the deviceId.
          if (user) return user;
        }
      } catch (e) {
        // If cookies() fails (e.g. in some environments), ignore and continue
        if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
          console.error('getCurrentUser - cookies error:', e);
        }
      }

      // 3. Fallback: Return null if no user found
      return null;
    })();

    return await Promise.race([userPromise, timeoutPromise]) as User | null;
  } catch (error: any) {
    // If timeout or other error, log and return null
    if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
      console.error('getCurrentUser - error:', error);
    }
    return null; // Return null on error to allow page to render
  }
}
