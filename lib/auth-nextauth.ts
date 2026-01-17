// Simplified auth using NextAuth.js (no Supabase needed)
import { getServerSession } from 'next-auth';
import { authOptions } from './auth-config';
import { prisma } from './prisma';

export async function getCurrentChild() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log('[getCurrentChild] No session');
      return null;
    }

    console.log('[getCurrentChild] Checking for child for email:', session.user.email);

    // Find child profile linked to this Google email
    // First, find parent account by email
    const parentAccount = await prisma.parentAccount.findUnique({
      where: { email: session.user.email },
      include: {
        children: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    console.log('[getCurrentChild] Parent account:', parentAccount ? `Found (${parentAccount.children.length} children)` : 'Not found');

    // If no parent account exists, create one (but don't create child automatically)
    if (!parentAccount) {
      console.log('[getCurrentChild] Creating parent account only');
      // Create parent account only
      await prisma.parentAccount.create({
        data: {
          email: session.user.email,
          googleId: session.user.email, // Use email as identifier
          name: session.user.name || null,
          image: session.user.image || null,
        },
      });

      // Return null so user can create child profile
      console.log('[getCurrentChild] Returning null - should show CreateChildProfile');
      return null;
    }

    // If parent exists but no children, return null so user can create child profile
    if (parentAccount.children.length === 0) {
      console.log('[getCurrentChild] No children found - returning null');
      return null;
    }

    // Return the active child if set, otherwise return the first child
    if (parentAccount.lastActiveChildId) {
      const activeChild = parentAccount.children.find(
        child => child.id === parentAccount.lastActiveChildId
      );
      if (activeChild) {
        console.log('[getCurrentChild] Returning active child:', activeChild.name);
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
      console.log('[getCurrentChild] Returning first child (set as active):', firstChild.name);
      return firstChild;
    }

    return null;
  } catch (error) {
    console.error('[getCurrentChild] Error:', error);
    // Return null on error so the page can still render (showing login screen)
    return null;
  }
}
