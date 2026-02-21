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
    const { redirect } = await import('next/navigation');
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

    // Add timeout wrapper for database queries
    const dbQuery = prisma.user.findUnique({
      where: { deviceId },
    });
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database query timeout')), 5000);
    });

    const user = await Promise.race([dbQuery, timeoutPromise]).catch((error) => {
      if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
        console.error('Anonymous session - database query error:', error);
      }
      return null; // Return null on error to allow creating new user
    }) as any;

    // If it's a Google account (not anonymous), force a NEW deviceId for anonymous learning
    if (user && !user.isAnonymous) {
      const newDeviceId = randomUUID();
      cookieStore.set('deviceId', newDeviceId, {
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
      });
      // Create new anonymous user
      try {
        await prisma.user.create({
          data: {
            deviceId: newDeviceId,
            isAnonymous: true,
            name: 'Guest',
          },
        });
      } catch (createError: any) {
        if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
          console.error('Anonymous session - create user error:', createError);
        }
        // Continue anyway - redirect will work even if user creation fails
      }
    } else if (!user) {
      // Create new anonymous user if not exists
      try {
        await prisma.user.create({
          data: {
            deviceId,
            isAnonymous: true,
            name: 'Guest',
          },
        });
      } catch (createError: any) {
        if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
          console.error('Anonymous session - create user error:', createError);
        }
        // Continue anyway - redirect will work even if user creation fails
      }
    }

    redirect('/');
  } catch (error: any) {
    // If redirect throws (expected), rethrow it
    if (error?.message?.includes('NEXT_REDIRECT')) {
      throw error;
    }
    // Log other errors
    if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
      console.error('Anonymous session - unexpected error:', error);
    }
    // Still try to redirect even on error
    const { redirect } = await import('next/navigation');
    redirect('/');
  }
}
