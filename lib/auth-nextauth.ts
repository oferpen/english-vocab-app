// Simplified auth using NextAuth.js (no Supabase needed)
import { getServerSession } from 'next-auth';
import { authOptions } from './auth-config';
import { prisma } from './prisma';

export async function getCurrentChild() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return null;
    }

    // Find child profile linked to this Google email
    // First, find parent account by email
    let parentAccount;
    try {
      parentAccount = await prisma.parentAccount.findUnique({
        where: { email: session.user.email },
        include: {
          children: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    } catch (dbError: any) {
      // If database table doesn't exist, return null
      if (dbError?.code === 'P2021' || dbError?.message?.includes('does not exist')) {
        return null;
      }
      throw dbError;
    }

    // If no parent account exists, create one (but don't create child automatically)
    if (!parentAccount) {
      try {
        // Create parent account only
        await prisma.parentAccount.create({
          data: {
            email: session.user.email,
            googleId: session.user.email, // Use email as identifier
            name: session.user.name || null,
            image: session.user.image || null,
          },
        });
      } catch (createError: any) {
        // If table doesn't exist, return null
        if (createError?.code === 'P2021' || createError?.message?.includes('does not exist')) {
          return null;
        }
        throw createError;
      }

      // Return null so user can create child profile
      return null;
    }

    // If parent exists but no children, return null so user can create child profile
    if (parentAccount.children.length === 0) {
      return null;
    }

    // Return the active child if set, otherwise return the first child
    if (parentAccount.lastActiveChildId) {
      const activeChild = parentAccount.children.find(
        child => child.id === parentAccount.lastActiveChildId
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
    // Return null on error so the page can still render (showing login screen)
    return null;
  }
}
