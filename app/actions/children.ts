'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getActiveChild() {
  const parentAccount = await prisma.parentAccount.findFirst();
  if (!parentAccount?.lastActiveChildId) {
    return null;
  }
  return prisma.childProfile.findUnique({
    where: { id: parentAccount.lastActiveChildId },
  });
}

export async function getAllChildren() {
  const parentAccount = await prisma.parentAccount.findFirst();
  if (!parentAccount) return [];
  
  return prisma.childProfile.findMany({
    where: { parentAccountId: parentAccount.id },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createChild(data: {
  name: string;
  avatar?: string;
  age?: number;
  grade?: string;
}) {
  const parentAccount = await prisma.parentAccount.findFirst();
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
  const parentAccount = await prisma.parentAccount.findFirst();
  if (!parentAccount) {
    throw new Error('Parent account not found');
  }

  await prisma.parentAccount.update({
    where: { id: parentAccount.id },
    data: { lastActiveChildId: childId },
  });

  revalidatePath('/');
  revalidatePath('/learn');
  revalidatePath('/quiz');
  revalidatePath('/progress');
}
