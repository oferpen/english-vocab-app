'use server';

import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getAllWords(level?: number) {
  const where: any = { active: true };
  
  // Filter by level if specified
  // Level 2 = basic words (difficulty 1)
  // Level 3 = less basic words (difficulty 2+)
  if (level === 2) {
    where.difficulty = 1;
  } else if (level === 3) {
    where.difficulty = { gte: 2 };
  }
  
  return prisma.word.findMany({
    where,
    orderBy: [
      { category: 'asc' },
      { englishWord: 'asc' },
    ],
  });
}

export async function getWord(id: string) {
  return prisma.word.findUnique({
    where: { id },
  });
}

export async function createWord(data: {
  englishWord: string;
  hebrewTranslation: string;
  category: string;
  difficulty?: number;
  imageUrl?: string;
  audioUrl?: string;
  exampleEn?: string;
  exampleHe?: string;
}) {
  const word = await prisma.word.create({
    data: {
      ...data,
      difficulty: data.difficulty || 1,
      active: true,
    },
  });
  revalidatePath('/parent');
  return word;
}

export async function updateWord(id: string, data: {
  englishWord?: string;
  hebrewTranslation?: string;
  category?: string;
  difficulty?: number;
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
  return word;
}

export async function deleteWord(id: string) {
  await prisma.word.delete({
    where: { id },
  });
  revalidatePath('/parent');
}

export const getWordsByCategory = cache(async (category: string, level?: number) => {
  const where: any = {
    category,
    active: true,
  };
  
  // Filter by level if specified
  // Level 2 = basic words (difficulty 1)
  // Level 3 = less basic words (difficulty 2+)
  if (level === 2) {
    where.difficulty = 1;
  } else if (level === 3) {
    where.difficulty = { gte: 2 };
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
