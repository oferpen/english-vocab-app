'use server';

import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';

export const getAllWords = cache(async (level?: number) => {
  const where: any = { active: true };

  if (level) {
    where.level = level;
  }

  return prisma.word.findMany({
    where,
    orderBy: [
      { category: 'asc' },
      { englishWord: 'asc' },
    ],
  });
});

export async function getWord(id: string) {
  return prisma.word.findUnique({
    where: { id },
  });
}

export async function createWord(data: {
  englishWord: string;
  hebrewTranslation: string;
  category: string;
  level?: number;
  imageUrl?: string;
  audioUrl?: string;
  exampleEn?: string;
  exampleHe?: string;
}) {
  const word = await prisma.word.create({
    data: {
      ...data,
      level: data.level || 1,
      active: true,
    },
  });
  revalidatePath('/parent');
  revalidatePath('/learn/path');
  revalidatePath('/admin');
  return word;
}

export async function updateWord(id: string, data: {
  englishWord?: string;
  hebrewTranslation?: string;
  category?: string;
  level?: number;
  active?: boolean;
  imageUrl?: string;
  audioUrl?: string;
  exampleEn?: string;
  exampleHe?: string;
}) {
  const word = await prisma.word.update({
    where: { id },
    data,
  });
  revalidatePath('/parent');
  revalidatePath('/learn/path');
  revalidatePath('/admin');
  return word;
}

export async function deleteWord(id: string) {
  await prisma.word.delete({
    where: { id },
  });
  revalidatePath('/parent');
  revalidatePath('/learn/path');
  revalidatePath('/admin');
}

export const getWordsByCategory = cache(async (category: string, level?: number) => {
  // Combine Starter A and Starter B when requesting "Starter" or "מילים בסיסיות"
  let where: any = { active: true };
  
  if (category === 'Starter' || category === 'מילים בסיסיות') {
    where.category = { in: ['Starter A', 'Starter B', 'Starter'] };
  } else {
    where.category = category;
  }

  if (level) {
    where.level = level;
  }

  return prisma.word.findMany({
    where,
    orderBy: { englishWord: 'asc' },
  });
});

export async function getAllCategories() {
  const categories = await prisma.word.findMany({
    where: { active: true },
    select: { category: true },
    distinct: ['category'],
  });
  return categories.map(c => c.category).filter(Boolean) as string[];
}

export async function getAllWordsAdmin() {
  noStore();
  // Get all words including inactive ones for admin panel
  return prisma.word.findMany({
    orderBy: [
      { category: 'asc' },
      { englishWord: 'asc' },
    ],
  });
}
