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

// Module-level promise cache to prevent duplicate calls (e.g., from React Strict Mode)
const markWordSeenCache = new Map<string, Promise<void>>();

export async function markWordSeen(childId: string, wordId: string, skipRevalidate: boolean = false) {
  // Create session key for deduplication
  const sessionKey = `${childId}-${wordId}`;
  
  // Check if we're already processing this session
  const existingPromise = markWordSeenCache.get(sessionKey);
  if (existingPromise) {
    // Already processing, return the existing promise
    return existingPromise;
  }
  
  // Create promise and cache it IMMEDIATELY (synchronously)
  const promise = (async () => {
    try {
      const progress = await getOrCreateProgress(childId, wordId);
      
      await prisma.progress.update({
        where: { id: progress.id },
        data: {
          timesSeenInLearn: progress.timesSeenInLearn + 1,
          lastSeenAt: new Date(),
        },
      });

      // Don't revalidate - let the UI update optimistically
      // Revalidation causes page re-renders which trigger additional server calls
      // if (!skipRevalidate) {
      //   revalidatePath('/progress');
      // }
    } catch (error) {
      // Remove from cache on error
      markWordSeenCache.delete(sessionKey);
      throw error;
    } finally {
      // Clean up after 1 second (keep promise cached briefly to handle React Strict Mode)
      setTimeout(() => {
        markWordSeenCache.delete(sessionKey);
      }, 1000);
    }
  })();
  
  // Cache the promise IMMEDIATELY before any async operations
  markWordSeenCache.set(sessionKey, promise);
  
  return promise;
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

  // Only revalidate progress page - other pages will update on next navigation
  revalidatePath('/progress');
}

// Global promise cache to prevent duplicate calls - checked BEFORE React's cache
const progressCache = new Map<string, Promise<any[]>>();

// This function is called BEFORE React's cache wrapper
function getAllProgressWithCache(childId: string): Promise<any[]> {
  // Check if there's already a pending promise for this childId
  if (progressCache.has(childId)) {
    return progressCache.get(childId)!;
  }
  
  // Create the promise and cache it IMMEDIATELY
  const promise = prisma.progress.findMany({
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
  
  // Cache the promise IMMEDIATELY before any async operations
  progressCache.set(childId, promise);
  
  // Clean up the cache after the promise resolves (keep for 5 seconds to handle React Strict Mode)
  promise.finally(() => {
    setTimeout(() => {
      progressCache.delete(childId);
    }, 5000);
  });
  
  return promise;
}

// Export directly - promise cache handles deduplication
export const getAllProgress = getAllProgressWithCache;

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
