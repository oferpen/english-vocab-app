'use server';

import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-helper';
import { randomUUID } from 'crypto';

export async function getCurrentUser() {
  const session = await getAuthSession();
  if (session?.user?.email) {
    return await prisma.user.findUnique({
      where: { email: session.user.email },
    });
  }

  // Also try cookie/deviceId if session is missing but we're in component context? 
  // Normally the client component or page will call this.
  // Ideally, reuse the logic from lib/auth.ts, but that's what we are essentially duplicating or should import.
  // For Server Actions, we can just import from lib/auth.
  const { getCurrentUser: getCurrentUserLib } = await import('@/lib/auth');
  return getCurrentUserLib();
}

export async function isGoogleAuthenticated(): Promise<boolean> {
  const session = await getAuthSession();
  return !!session?.user?.email;
}

export async function startAnonymousSession() {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    let deviceId = cookieStore.get('deviceId')?.value;

    // FALLBACK: If middleware hasn't set it yet, set it here
    if (!deviceId) {
      deviceId = randomUUID();
      cookieStore.set('deviceId', deviceId, {
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
      });
    }

    // Add timeout wrapper for database queries - use shorter timeout
    let user = null;
    try {
      const dbQuery = prisma.user.findUnique({
        where: { deviceId },
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database query timeout')), 3000); // Shorter timeout
      });

      user = await Promise.race([dbQuery, timeoutPromise]) as any;
    } catch (error: any) {
      // Database query failed or timed out - continue without user
      if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
        console.error('Anonymous session - database query error:', error);
      }
      user = null; // Continue without user
    }

    // If it's a Google account (not anonymous), force a NEW deviceId for anonymous learning
    if (user && !user.isAnonymous) {
      const newDeviceId = randomUUID();
      cookieStore.set('deviceId', newDeviceId, {
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
      });
      // Create new anonymous user with timeout - WAIT for it to complete
      try {
        const createPromise = prisma.user.create({
          data: {
            deviceId: newDeviceId,
            isAnonymous: true,
            name: 'Guest',
          },
        });
        const createTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Create user timeout')), 3000);
        });
        await Promise.race([createPromise, createTimeout]);
      } catch (createError: any) {
        // If creation fails, continue anyway - cookie is set
        if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
          console.error('Anonymous session - create user error:', createError);
        }
      }
    } else if (!user) {
      // Create new anonymous user if not exists - WAIT for it to complete
      try {
        const createPromise = prisma.user.create({
          data: {
            deviceId,
            isAnonymous: true,
            name: 'Guest',
          },
        });
        const createTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Create user timeout')), 3000);
        });
        await Promise.race([createPromise, createTimeout]);
      } catch (createError: any) {
        // If creation fails, continue anyway - cookie is set
        if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
          console.error('Anonymous session - create user error:', createError);
        }
      }
    }

    // Return success instead of redirecting - client will handle redirect
    return { success: true };
  } catch (error: any) {
    // Log errors but still return success so client can redirect
    if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
      console.error('Anonymous session - error:', error);
    }
    // Return success anyway - let client handle redirect
    return { success: true, error: error?.message };
  }
}
