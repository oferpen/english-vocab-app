'use server';

import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-helper';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';

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

    // Add timeout wrapper for database queries
    let user = null;
    try {
      const dbQuery = prisma.user.findUnique({
        where: { deviceId },
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database query timeout')), 5000);
      });

      user = await Promise.race([dbQuery, timeoutPromise]) as any;
    } catch (error: any) {
      // Database query failed or timed out - continue without user
      if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
        console.error('[Anonymous Session] Database query error:', error?.message);
      }
      user = null;
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
      deviceId = newDeviceId; // Update deviceId for user creation
      user = null; // Reset user so we create a new anonymous one
    }

    // Create new anonymous user if not exists - WAIT for it to complete
    if (!user) {
      try {
        const createPromise = prisma.user.create({
          data: {
            deviceId,
            isAnonymous: true,
            name: 'Guest',
          },
        });
        const createTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Create user timeout')), 5000);
        });
        user = await Promise.race([createPromise, createTimeout]) as any;
        
        if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
          console.log('[Anonymous Session] User created successfully:', user?.id);
        }
      } catch (createError: any) {
        // If creation fails, try to find user (might have been created by race condition)
        if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
          console.error('[Anonymous Session] Create user error:', createError?.message);
        }
        
        // Retry finding user - might have been created by concurrent request
        try {
          const retryQuery = prisma.user.findUnique({
            where: { deviceId },
          });
          const retryTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Retry query timeout')), 2000);
          });
          user = await Promise.race([retryQuery, retryTimeout]) as any;
          
          if (user && process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
            console.log('[Anonymous Session] User found on retry:', user?.id);
          }
        } catch (retryError) {
          // Ignore retry errors
          if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
            console.error('[Anonymous Session] Retry query error:', retryError);
          }
        }
      }
    }

    // Final verification - user must exist
    if (!user) {
      const errorMsg = `Failed to create or find user for deviceId: ${deviceId}`;
      if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
        console.error('[Anonymous Session]', errorMsg);
      }
      return { success: false, error: errorMsg, deviceId };
    }

    // Success - user exists and cookie is set
    // Revalidate the homepage to ensure it picks up the new cookie
    revalidatePath('/');
    
    return { success: true, deviceId, userCreated: true, userId: user.id };
  } catch (error: any) {
    const errorMsg = error?.message || 'Unknown error';
    if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
      console.error('[Anonymous Session] Unexpected error:', errorMsg);
    }
    return { success: false, error: errorMsg };
  }
}
