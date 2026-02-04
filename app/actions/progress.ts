'use server';

import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getProgress(userId: string, wordId: string) {
  return prisma.progress.findUnique({
    where: {
      userId_wordId: {
        userId,
        wordId,
      },
    },
  });
}

export async function getOrCreateProgress(userId: string, wordId: string) {
  let progress = await getProgress(userId, wordId);
  if (!progress) {
    progress = await prisma.progress.create({
      data: {
        userId,
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

export async function markWordSeen(userId: string, wordId: string, skipRevalidate: boolean = false) {
  // Create session key for deduplication
  const sessionKey = `${userId}-${wordId}`;

  // Check if we're already processing this session
  const existingPromise = markWordSeenCache.get(sessionKey);
  if (existingPromise) {
    // Already processing, return the existing promise
    return existingPromise;
  }

  // Create promise and cache it IMMEDIATELY (synchronously)
  const promise = (async () => {
    try {
      const progress = await getOrCreateProgress(userId, wordId);

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

// Module-level promise cache to prevent duplicate calls (e.g., from React Strict Mode)
const recordQuizAttemptCache = new Map<string, Promise<void>>();

export async function recordQuizAttempt(
  userId: string,
  wordId: string,
  questionType: 'EN_TO_HE' | 'HE_TO_EN' | 'AUDIO_TO_EN',
  correct: boolean,
  isExtra: boolean = false
) {
  // Create session key for deduplication (include questionType and correct to handle retries)
  const sessionKey = `${userId}-${wordId}-${questionType}-${correct}`;

  // Check if we're already processing this session
  const existingPromise = recordQuizAttemptCache.get(sessionKey);
  if (existingPromise) {
    // Already processing, return the existing promise
    return existingPromise;
  }

  // Create promise and cache it IMMEDIATELY (synchronously)
  const promise = (async () => {
    try {
      // Create quiz attempt
      await prisma.quizAttempt.create({
        data: {
          userId,
          wordId,
          questionType,
          correct,
          isExtra,
        },
      });

      // Update progress
      const progress = await getOrCreateProgress(userId, wordId);
      const newAttempts = progress.quizAttempts + 1;
      const newCorrect = progress.quizCorrect + (correct ? 1 : 0);

      // Calculate mastery score based on latest attempt only
      // Since we just created this attempt, it's the latest one
      // Mastery is 100% if latest attempt was correct, 0% if wrong
      const masteryScore = correct ? 100 : 0;

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

      // Revalidate path page to update category completion status after quiz attempts
      // Only revalidate if this is likely the last attempt in a quiz (we'll do it once at quiz end)
      // For now, don't revalidate here to avoid too many calls, but ensure it's done at quiz completion
    } catch (error) {
      // Remove from cache on error
      recordQuizAttemptCache.delete(sessionKey);
      throw error;
    } finally {
      // Clean up after 1 second (keep promise cached briefly to handle React Strict Mode)
      setTimeout(() => {
        recordQuizAttemptCache.delete(sessionKey);
      }, 1000);
    }
  })();

  // Cache the promise IMMEDIATELY before any async operations
  recordQuizAttemptCache.set(sessionKey, promise);

  return promise;
}

// Global promise cache to prevent duplicate calls - checked BEFORE React's cache
const progressCache = new Map<string, Promise<any[]>>();

// This function is called BEFORE React's cache wrapper
function getAllProgressWithCache(userId: string): Promise<any[]> {
  // Check if there's already a pending promise for this userId
  if (progressCache.has(userId)) {
    return progressCache.get(userId)!;
  }

  // Create the promise and cache it IMMEDIATELY
  const promise = prisma.progress.findMany({
    where: { userId },
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
  progressCache.set(userId, promise);

  // Clean up the cache after the promise resolves (keep for 5 seconds to handle React Strict Mode)
  promise.finally(() => {
    setTimeout(() => {
      progressCache.delete(userId);
    }, 5000);
  });

  return promise;
}

// Export directly - promise cache handles deduplication
export const getAllProgress = getAllProgressWithCache;

export async function getWordsNeedingReview(userId: string, level?: number) {
  const where: any = {
    userId,
    needsReview: true,
  };

  // Filter by level if specified
  if (level !== undefined) {
    where.word = { level: level };
  }

  return prisma.progress.findMany({
    where,
    include: {
      word: true,
    },
  });
}

export async function getUnseenWords(userId: string, level?: number) {
  const progress = await prisma.progress.findMany({
    where: { userId },
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
    where.level = level;
  }

  return prisma.word.findMany({
    where,
  });
}

export async function revalidateLearnPath() {
  revalidatePath('/learn/path');
}
