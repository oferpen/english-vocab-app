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

  const user = await prisma.user.findUnique({
    where: { deviceId },
  });

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
    await prisma.user.create({
      data: {
        deviceId: newDeviceId,
        isAnonymous: true,
        name: 'Guest',
      },
    });
  } else if (!user) {
    // Create new anonymous user if not exists
    await prisma.user.create({
      data: {
        deviceId,
        isAnonymous: true,
        name: 'Guest',
      },
    });
  }

  redirect('/');
}
