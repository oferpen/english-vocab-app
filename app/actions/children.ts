'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCurrentParentAccount } from '@/lib/auth';
import { getAuthSession } from '@/lib/auth-helper';

export async function getActiveChild() {
  // First check if there's a Google session
  const session = await getAuthSession();
  if (!session?.user?.email) {
    // No Google session - don't return any child
    // This ensures that children must explicitly select themselves
    return null;
  }
  
  const parentAccount = await getCurrentParentAccount();
  
  if (parentAccount?.lastActiveChildId) {
    // If parent is logged in, return their active child
    return prisma.childProfile.findUnique({
      where: { id: parentAccount.lastActiveChildId },
    });
  }
  
  return null;
}

export async function getAllChildren() {
  const parentAccount = await getCurrentParentAccount();
  
  if (parentAccount) {
    // If parent is logged in, return only their children
    return prisma.childProfile.findMany({
      where: { parentAccountId: parentAccount.id },
      orderBy: { createdAt: 'desc' },
    });
  }
  
  // If no session, return all children in the system
  // This allows child login screen to work without parent being logged in
  // Note: This assumes single-family usage. For multi-family, consider adding child-level PINs
  return prisma.childProfile.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function createChild(data: {
  name: string;
  avatar?: string;
  age?: number;
  grade?: string;
}) {
  const parentAccount = await getCurrentParentAccount();
  if (!parentAccount) {
    throw new Error('Parent account not found');
  }

  const child = await prisma.childProfile.create({
    data: {
      ...data,
      parentAccountId: parentAccount.id,
    },
  });

  // Set as active if it's the first child
  if (!parentAccount.lastActiveChildId) {
    await prisma.parentAccount.update({
      where: { id: parentAccount.id },
      data: { lastActiveChildId: child.id },
    });
  }

  // Create level state for new child
  await prisma.levelState.create({
    data: {
      childId: child.id,
      level: 1,
      xp: 0,
    },
  });

  revalidatePath('/');
  revalidatePath('/parent');
  return child;
}

export async function updateChild(id: string, data: {
  name?: string;
  avatar?: string;
  age?: number;
  grade?: string;
}) {
  const child = await prisma.childProfile.update({
    where: { id },
    data,
  });
  revalidatePath('/parent');
  return child;
}

export async function deleteChild(id: string) {
  await prisma.childProfile.delete({
    where: { id },
  });
  revalidatePath('/parent');
}

export async function setActiveChild(childId: string) {
  const parentAccount = await getCurrentParentAccount();
  
  if (parentAccount) {
    // Verify that the child belongs to this parent account
    const child = await prisma.childProfile.findUnique({
      where: { id: childId },
      select: { parentAccountId: true },
    });
    
    if (!child) {
      throw new Error('Child not found');
    }
    
    if (child.parentAccountId !== parentAccount.id) {
      throw new Error('Child does not belong to this parent account');
    }
    
    // If parent is logged in, update their active child
    await prisma.parentAccount.update({
      where: { id: parentAccount.id },
      data: { lastActiveChildId: childId },
    });
  } else {
    // If no session, find the child's parent and update their active child
    const child = await prisma.childProfile.findUnique({
      where: { id: childId },
      select: { parentAccountId: true },
    });
    
    if (!child) {
      throw new Error('Child not found');
    }
    
    await prisma.parentAccount.update({
      where: { id: child.parentAccountId },
      data: { lastActiveChildId: childId },
    });
  }

  revalidatePath('/');
  revalidatePath('/learn');
  revalidatePath('/quiz');
  revalidatePath('/progress');
}
