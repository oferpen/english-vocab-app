'use server';

import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getProgress(childId: string, wordId: string) {
  return prisma.progress.findUnique({
    where: {
      childId_wordId: {
        childId,
        wordId,
      },
    },
  });
}

export async function getOrCreateProgress(childId: string, wordId: string) {
  let progress = await getProgress(childId, wordId);
  if (!progress) {
    progress = await prisma.progress.create({
      data: {
        childId,
        wordId,
        timesSeenInLearn: 0,
        quizAttempts: 0,
        quizCorrect: 0,
        masteryScore: 0,
        needsReview: false,
      },
    });
  }
  return progress;
}

export async function markWordSeen(childId: string, wordId: string) {
  const progress = await getOrCreateProgress(childId, wordId);
  
  await prisma.progress.update({
    where: { id: progress.id },
    data: {
      timesSeenInLearn: progress.timesSeenInLearn + 1,
      lastSeenAt: new Date(),
    },
  });

  revalidatePath('/learn');
  revalidatePath('/progress');
  revalidatePath('/learn/path');
}

export async function recordQuizAttempt(
  childId: string,
  wordId: string,
  questionType: 'EN_TO_HE' | 'HE_TO_EN' | 'AUDIO_TO_EN',
  correct: boolean,
  isExtra: boolean = false
) {
  // Create quiz attempt
  await prisma.quizAttempt.create({
    data: {
      childId,
      wordId,
      questionType,
      correct,
      isExtra,
    },
  });

  // Update progress
  const progress = await getOrCreateProgress(childId, wordId);
  const newAttempts = progress.quizAttempts + 1;
  const newCorrect = progress.quizCorrect + (correct ? 1 : 0);
  
  // Calculate mastery score (0-100)
  const masteryScore = newAttempts > 0 ? Math.round((newCorrect / newAttempts) * 100) : 0;

  await prisma.progress.update({
    where: { id: progress.id },
    data: {
      quizAttempts: newAttempts,
      quizCorrect: newCorrect,
      masteryScore,
      needsReview: correct ? progress.needsReview : true, // Mark for review if wrong
      lastSeenAt: new Date(),
    },
  });

  revalidatePath('/quiz');
  revalidatePath('/progress');
  revalidatePath('/learn/path');
}

export const getAllProgress = cache(async (childId: string) => {
  return prisma.progress.findMany({
    where: { childId },
    include: {
      word: true,
    },
    orderBy: [
      { needsReview: 'desc' },
      { masteryScore: 'asc' },
      { lastSeenAt: 'desc' },
    ],
  });
});

export async function getWordsNeedingReview(childId: string, level?: number) {
  const where: any = {
    childId,
    needsReview: true,
  };
  
  // Filter by level if specified
  if (level !== undefined) {
    if (level === 2) {
      where.word = { difficulty: 1 };
    } else if (level === 3) {
      where.word = { difficulty: { gte: 2 } };
    }
  }
  
  return prisma.progress.findMany({
    where,
    include: {
      word: true,
    },
  });
}

export async function getUnseenWords(childId: string, level?: number) {
  const progress = await prisma.progress.findMany({
    where: { childId },
    select: { wordId: true },
  });

  const seenWordIds = new Set(progress.map((p) => p.wordId));

  const where: any = {
    active: true,
    id: {
      notIn: Array.from(seenWordIds),
    },
  };
  
  // Filter by level if specified
  if (level !== undefined) {
    if (level === 2) {
      where.difficulty = 1;
    } else if (level === 3) {
      where.difficulty = { gte: 2 };
    }
  }

  return prisma.word.findMany({
    where,
  });
}
