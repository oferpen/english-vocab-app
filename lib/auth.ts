import { prisma } from './prisma';
import { getAuthSession } from './auth-helper';

export async function getCurrentUser() {
  // 1. Try to get from session (Google auth)
  const session = await getAuthSession();
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (user) return user;
  }

  // 2. Try to get from deviceId (Anonymous)
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const deviceId = cookieStore.get('deviceId')?.value;
    if (deviceId) {
      const user = await prisma.user.findUnique({
        where: { deviceId },
      });
      // Allow device-based login for anonymous users or valid google users who are just not in session yet (though session check above handles that usually)
      // Actually, for pure anonymous access, we mostly care about the deviceId.
      if (user) return user;
    }
  } catch (e) {
    // If cookies() fails (e.g. in some environments), ignore and continue
  }

  // 3. Fallback: Return null if no user found
  return null;
}
