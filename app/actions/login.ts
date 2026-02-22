'use server';

import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Simple anonymous login action
 * Creates or finds user and redirects directly
 */
export async function loginAnonymous() {
  try {
    const cookieStore = await cookies();
    let deviceId = cookieStore.get('deviceId')?.value;

    // Generate deviceId if not exists
    if (!deviceId) {
      deviceId = randomUUID();
    }

    // Always set cookie to ensure it's in response
    const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
    cookieStore.set('deviceId', deviceId, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
    });

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { deviceId },
    });

    if (!user) {
      // Create new anonymous user
      user = await prisma.user.create({
        data: {
          deviceId,
          isAnonymous: true,
          name: 'Guest',
        },
      });
    }

    // User exists - redirect to learn path
    // This will throw NEXT_REDIRECT which Next.js handles
    redirect('/learn/path');
  } catch (error: any) {
    // If it's a redirect, rethrow it
    if (error?.message?.includes('NEXT_REDIRECT')) {
      throw error;
    }
    // Log error but don't crash
    console.error('[Login] Error:', error?.message);
    // Return error instead of redirecting
    return { error: error?.message || 'Login failed' };
  }
}
