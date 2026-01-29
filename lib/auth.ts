import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { getAuthSession } from './auth-helper';

export async function getCurrentParentAccount() {
  // Try to get from session (Google auth)
  const session = await getAuthSession();
  if (session?.user?.email) {
    const account = await prisma.parentAccount.findUnique({
      where: { email: session.user.email },
    });
    if (account) return account;
  }

  // If no Google session, return the first parent account
  // This allows PIN-based login to work without Google session
  // Note: This assumes single-family usage. For multi-family, consider adding session management for PIN auth
  const firstParent = await prisma.parentAccount.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  return firstParent || null;
}

export async function verifyPIN(pin: string): Promise<boolean> {
  try {
    const accounts = await prisma.parentAccount.findMany({
      where: { pinHash: { not: null } },
    });

    console.log(`[verifyPIN] Found ${accounts.length} accounts with PIN hashes`);

    for (const account of accounts) {
      if (account.pinHash) {
        const match = await bcrypt.compare(pin, account.pinHash);
        console.log(`[verifyPIN] Comparing with account ${account.id} (${account.email || 'no email'}): ${match}`);
        if (match) {
          return true;
        }
      }
    }

    console.log('[verifyPIN] No match found for provided PIN');
    return false;
  } catch (error) {
    console.error('[verifyPIN] Error:', error);
    return false;
  }
}

export async function setPIN(pin: string): Promise<void> {
  const pinHash = await bcrypt.hash(pin, 10);
  const session = await getAuthSession();

  if (session?.user?.email) {
    // User is logged in via Google, set PIN for their account
    const account = await prisma.parentAccount.findUnique({
      where: { email: session.user.email },
    });
    if (account) {
      await prisma.parentAccount.update({
        where: { id: account.id },
        data: { pinHash },
      });
      return;
    }
  }

  // If no Google session, create a new account with PIN
  // This allows PIN-only accounts
  await prisma.parentAccount.create({
    data: {
      pinHash,
      settingsJson: JSON.stringify({
        questionTypes: {
          enToHe: true,
          heToEn: true,
          audioToEn: true,
        },
      }),
    },
  });
}

export async function updatePIN(pin: string): Promise<boolean> {
  try {
    const parentAccount = await getCurrentParentAccount();
    if (!parentAccount) return false;

    const pinHash = await bcrypt.hash(pin, 10);
    await prisma.parentAccount.update({
      where: { id: parentAccount.id },
      data: { pinHash },
    });
    return true;
  } catch (error) {
    console.error('[updatePIN] Error:', error);
    return false;
  }
}

export async function hasPIN(): Promise<boolean> {
  const parentAccount = await getCurrentParentAccount();
  return !!parentAccount?.pinHash;
}
