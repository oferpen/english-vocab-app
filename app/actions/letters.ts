'use server';

import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export const getAllLetters = cache(async () => {
  try {
    return await prisma.letter.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    });
  } catch (error: any) {
    // If table doesn't exist yet, return empty array
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      return [];
    }
    throw error;
  }
});

export async function getLetter(id: string) {
  return prisma.letter.findUnique({
    where: { id },
  });
}

export async function getLetterProgress(userId: string, letterId: string) {
  return prisma.letterProgress.findUnique({
    where: {
      userId_letterId: {
        userId,
        letterId,
      },
    },
    include: {
      letter: true,
    },
  });
}

// Global promise cache to prevent duplicate calls - checked BEFORE React's cache
const letterProgressCache = new Map<string, Promise<any[]>>();

// This function is called BEFORE React's cache wrapper
function getAllLetterProgressWithCache(userId: string): Promise<any[]> {
  // Validate input
  if (!userId || typeof userId !== 'string') {
    console.warn('getAllLetterProgress: Invalid userId', userId);
    return Promise.resolve([]);
  }

  // Check if there's already a pending promise for this userId
  if (letterProgressCache.has(userId)) {
    return letterProgressCache.get(userId)!;
  }

  // Create the promise and cache it IMMEDIATELY
  const promise = (async () => {
    try {
      const progress = await prisma.letterProgress.findMany({
        where: { userId },
        include: {
          letter: {
            select: {
              id: true,
              letter: true,
              name: true,
              order: true,
              active: true,
            },
          },
        },
      });

      // Filter out any progress entries with null letters and sort by letter order
      const validProgress = progress
        .filter((p) => p.letter !== null && p.letter !== undefined)
        .sort((a: any, b: any) => {
          const orderA = a.letter?.order ?? 0;
          const orderB = b.letter?.order ?? 0;
          return orderA - orderB;
        });

      return validProgress;
    } catch (error: any) {
      // If table doesn't exist yet, return empty array
      if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
        return [];
      }
      // Log the error for debugging but return empty array to prevent revalidation failures
      console.error('Error in getAllLetterProgress:', {
        error: error?.message || error,
        code: error?.code,
        userId,
      });
      // Return empty array instead of throwing to prevent 500 errors during revalidation
      return [];
    }
  })();

  letterProgressCache.set(userId, promise);

  // Clean up the cache after the promise resolves
  promise.finally(() => {
    setTimeout(() => {
      letterProgressCache.delete(userId);
    }, 5000);
  });

  return promise;
}

// Export directly - promise cache handles deduplication
export const getAllLetterProgress = getAllLetterProgressWithCache;

export async function markLetterSeen(userId: string, letterId: string, correct: boolean) {
  const existing = await prisma.letterProgress.findUnique({
    where: {
      userId_letterId: {
        userId,
        letterId,
      },
    },
  });

  if (existing) {
    const newTimesSeen = existing.timesSeen + 1;
    const newTimesCorrect = correct ? existing.timesCorrect + 1 : existing.timesCorrect;
    const mastered = newTimesCorrect >= 3 && newTimesSeen >= 3; // Mastered after 3 correct out of 3+ attempts

    await prisma.letterProgress.update({
      where: { id: existing.id },
      data: {
        timesSeen: newTimesSeen,
        timesCorrect: newTimesCorrect,
        mastered,
        lastSeenAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Award XP for mastering a letter
    if (mastered && !existing.mastered) {
      const { addXP } = await import('./levels');
      await addXP(userId, 5);
    }

    return { mastered, timesSeen: newTimesSeen, timesCorrect: newTimesCorrect };
  } else {
    const mastered = correct && true; // First attempt correct = mastered
    await prisma.letterProgress.create({
      data: {
        userId,
        letterId,
        timesSeen: 1,
        timesCorrect: correct ? 1 : 0,
        mastered,
        lastSeenAt: new Date(),
      },
    });

    if (mastered) {
      const { addXP } = await import('./levels');
      await addXP(userId, 5);
    }

    return { mastered, timesSeen: 1, timesCorrect: correct ? 1 : 0 };
  }
}

export async function getUnmasteredLetters(userId: string) {
  try {
    const allLetters = await getAllLetters();
    const progress = await getAllLetterProgress(userId);

    const masteredLetterIds = new Set(
      progress.filter((p) => p.mastered).map((p) => p.letterId)
    );

    return allLetters.filter((letter) => !masteredLetterIds.has(letter.id));
  } catch (error: any) {
    console.error('Error in getUnmasteredLetters:', error);
    // Return all letters if there's an error
    return await getAllLetters().catch(() => []);
  }
}

export async function checkLevel1Complete(userId: string): Promise<boolean> {
  try {
    const masteredCount = await prisma.letterProgress.count({
      where: {
        userId,
        mastered: true
      }
    });
    // Level 1 complete when at least 20 letters are mastered (out of 26)
    return masteredCount >= 20;
  } catch (error: any) {
    console.error('Error in checkLevel1Complete:', error);
    // Return false if there's an error (safer to not unlock level 2)
    return false;
  }
}
