'use server';

import { verifyPIN as verifyPINLib, hasPIN as hasPINLib, setPIN as setPINLib } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-helper';

export async function verifyPIN(pin: string): Promise<boolean> {
  return verifyPINLib(pin);
}

export async function hasPIN(): Promise<boolean> {
  return hasPINLib();
}

export async function setPIN(pin: string): Promise<void> {
  return setPINLib(pin);
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
