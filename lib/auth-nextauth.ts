import { getServerSession } from 'next-auth';
import { authOptions } from './auth-config';
import { prisma } from './prisma';
import { cookies } from 'next/headers';

export async function getCurrentChild() {
  try {
    const session = await getServerSession(authOptions);
    const cookieStore = await cookies();
    const deviceId = cookieStore.get('deviceId')?.value;

    let parentAccount = null;

    if (session?.user?.email) {
      // Find parent account by Google email
      parentAccount = await (prisma as any).parentAccount.findUnique({
        where: { email: session.user.email },
        include: {
          children: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    } else if (deviceId) {
      // Find parent account by deviceId (anonymous)
      parentAccount = await (prisma as any).parentAccount.findFirst({
        where: {
          deviceId,
          isAnonymous: true // ONLY allow device-based login for anonymous accounts
        },
        include: {
          children: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (parentAccount && !(parentAccount as any).isAnonymous) {
        // Safety check: if somehow a Google account was found, don't use it
        parentAccount = null;
      }
    }

    if (!parentAccount) {
      if (session?.user?.email) {
        // Create parent account for Google user if missing
        try {
          parentAccount = await (prisma as any).parentAccount.create({
            data: {
              email: session.user.email,
              googleId: session.user.email,
              name: session.user.name || null,
              image: session.user.image || null,
            },
            include: { children: true }
          });
        } catch (createError: any) {
          if (createError?.code === 'P2021' || createError?.message?.includes('does not exist')) {
            return null;
          }
          throw createError;
        }
      } else {
        return null;
      }
    }

    // If parent exists but no children, return null so user can create child profile
    if (parentAccount.children.length === 0) {
      return null;
    }

    // Return the active child if set, otherwise return the first child
    if (parentAccount.lastActiveChildId) {
      const activeChild = parentAccount.children.find(
        (child: any) => child.id === parentAccount.lastActiveChildId
      );
      if (activeChild) {
        return activeChild;
      }
    }

    // If no active child set, return the first child and set it as active
    const firstChild = parentAccount.children[0];
    if (firstChild) {
      await prisma.parentAccount.update({
        where: { id: parentAccount.id },
        data: { lastActiveChildId: firstChild.id },
      });
      return firstChild;
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Initializes an anonymous account and a default child profile
 */
export async function initAnonymousAccount(deviceId: string) {
  try {
    // Double check if account already exists
    let parentAccount: any = await (prisma as any).parentAccount.findUnique({
      where: { deviceId },
      include: { children: true }
    });

    // If account exists and is NOT anonymous, this deviceId cannot be used for anonymous access.
    // We return null to signal that this deviceId is "claimed".
    if (parentAccount && !parentAccount.isAnonymous) {
      return null;
    }

    if (parentAccount && parentAccount.children && parentAccount.children.length > 0) {
      return parentAccount;
    }

    if (!parentAccount) {
      // Create anonymous parent account
      parentAccount = await (prisma as any).parentAccount.create({
        data: {
          deviceId,
          isAnonymous: true,
          settingsJson: JSON.stringify({
            questionTypes: {
              enToHe: true,
              heToEn: true,
              audioToEn: true,
            },
          }),
        },
        include: { children: true }
      });
    }

    // Create default child profile if missing
    if (!parentAccount.children || parentAccount.children.length === 0) {
      const avatars = ['🦁', '🦊', '🐼', '🐨', '🐯', '🐸'];
      const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

      const child = await prisma.childProfile.create({
        data: {
          parentAccountId: parentAccount.id,
          name: 'אני',
          avatar: randomAvatar,
          age: 10,
        }
      });

      // Update parent's last active child
      await prisma.parentAccount.update({
        where: { id: parentAccount.id },
        data: { lastActiveChildId: child.id }
      });

      // Refresh parent account with children
      parentAccount = await (prisma as any).parentAccount.findUnique({
        where: { id: parentAccount.id },
        include: { children: true }
      });
    }

    return parentAccount;
  } catch (error) {
    console.error('Error in initAnonymousAccount:', error);
    throw error;
  }
}
