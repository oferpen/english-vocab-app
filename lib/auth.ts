import { prisma } from './prisma';
import { getAuthSession } from './auth-helper';
import { AuthService } from './services/AuthService';
import { User } from '@prisma/client';

export async function getCurrentUser(): Promise<User | null> {
  try {
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
      // Continue to deviceId check
    }

    // 2. Try to get from deviceId (Anonymous) using AuthService
    try {
      const deviceId = await AuthService.getDeviceId();
      const user = await AuthService.findUserByDeviceId(deviceId);
      if (user) return user;
    } catch (e) {
      // Ignore errors
    }

    // 3. No user found
    return null;
  } catch (error: any) {
    console.error('[getCurrentUser] Error:', error?.message);
    return null;
  }
}
