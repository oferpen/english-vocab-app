'use server';

import { verifyPIN as verifyPINLib, hasPIN as hasPINLib, setPIN as setPINLib } from '@/lib/auth';

export async function verifyPIN(pin: string): Promise<boolean> {
  return verifyPINLib(pin);
}

export async function hasPIN(): Promise<boolean> {
  return hasPINLib();
}

export async function setPIN(pin: string): Promise<void> {
  return setPINLib(pin);
}
