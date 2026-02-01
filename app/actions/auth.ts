'use server';

import { verifyPIN as verifyPINLib, hasPIN as hasPINLib, setPIN as setPINLib, updatePIN as updatePINLib } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-helper';
import { randomUUID } from 'crypto';

export async function verifyPIN(pin: string): Promise<boolean> {
  return verifyPINLib(pin);
}

export async function hasPIN(): Promise<boolean> {
  return hasPINLib();
}

export async function setPIN(pin: string): Promise<void> {
  return setPINLib(pin);
}

export async function updatePIN(pin: string): Promise<boolean> {
  return updatePINLib(pin);
}

export async function getCurrentParentAccount() {
  const session = await getAuthSession();
  if (!session?.user?.email) {
    return null;
  }

  return await prisma.parentAccount.findUnique({
    where: { email: session.user.email },
  });
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

  const parentAccount = await prisma.parentAccount.findUnique({
    where: { deviceId } as any,
  });

  // If it's a Google account, force a NEW deviceId for anonymous learning
  if (parentAccount && !(parentAccount as any).isAnonymous) {
    const newDeviceId = randomUUID();
    cookieStore.set('deviceId', newDeviceId, {
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });
  }

  redirect('/');
}
