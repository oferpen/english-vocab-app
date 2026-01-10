'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getAllWords() {
  return prisma.word.findMany({
    where: { active: true },
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

export async function getWordsByCategory(category: string) {
  return prisma.word.findMany({
    where: {
      category,
      active: true,
    },
    orderBy: { englishWord: 'asc' },
  });
}
