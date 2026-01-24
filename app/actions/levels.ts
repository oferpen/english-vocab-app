'use server';

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const XP_PER_WORD_MASTERED = 10;
const XP_PER_MISSION = 50;
const XP_PER_STREAK_DAY = 5;

// Level mapping:
// Level 1 = Letters (A-Z)
// Level 2 = Basic words (difficulty 1)
// Level 3 = Less basic words (difficulty 2+)

const LEVEL_XP_REQUIREMENTS = [
  0,    // Level 1 (Letters) - unlocked by default
  50,   // Level 2 (Basic words) - unlock after mastering 20 letters
  150,  // Level 3 (Less basic words) - unlock after mastering 50 basic words
];

export async function getLevelContentType(level: number): Promise<'letters' | 'basic_words' | 'advanced_words'> {
  if (level === 1) return 'letters';
  if (level === 2) return 'basic_words';
  return 'advanced_words'; // Level 3+
}

export async function canAccessLevel(childLevel: number, requiredLevel: number): Promise<boolean> {
  return childLevel >= requiredLevel;
}

// Global promise cache to prevent duplicate calls - checked BEFORE React's cache
const levelStateCache = new Map<string, Promise<any>>();

// This function is called BEFORE React's cache wrapper
function getLevelStateWithCache(childId: string): Promise<any> {
  // Validate input
  if (!childId || typeof childId !== 'string') {
    console.warn('getLevelState: Invalid childId', childId);
    return Promise.resolve({ id: '', childId: childId || '', level: 1, xp: 0, updatedAt: new Date() });
  }

  // Check if there's already a pending promise for this childId
  if (levelStateCache.has(childId)) {
    return levelStateCache.get(childId)!;
  }

  // Create the promise and cache it IMMEDIATELY
  const promise = (async () => {
    try {
      let levelState = await prisma.levelState.findUnique({
        where: { childId },
      });

      if (!levelState) {
        try {
          levelState = await prisma.levelState.create({
            data: {
              childId,
              level: 1,
              xp: 0,
            },
          });
        } catch (createError: any) {
          // If table doesn't exist or creation fails, return a default object
          if (createError?.code === 'P2021' || createError?.message?.includes('does not exist')) {
            return { id: '', childId, level: 1, xp: 0, updatedAt: new Date() };
          }
          // Log error but return default instead of throwing
          console.error('Error creating levelState:', createError);
          return { id: '', childId, level: 1, xp: 0, updatedAt: new Date() };
        }
      }

      return levelState;
    } catch (error: any) {
      // If table doesn't exist, return a default object
      if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
        return { id: '', childId, level: 1, xp: 0, updatedAt: new Date() };
      }
      // Log error but return default instead of throwing to prevent revalidation failures
      console.error('Error in getLevelState:', {
        error: error?.message || error,
        code: error?.code,
        childId,
      });
      return { id: '', childId, level: 1, xp: 0, updatedAt: new Date() };
    }
  })();

  levelStateCache.set(childId, promise);

  // Clean up the cache after the promise resolves
  promise.finally(() => {
    setTimeout(() => {
      levelStateCache.delete(childId);
    }, 5000);
  });

  return promise;
}

// Export directly - promise cache handles deduplication
export const getLevelState = getLevelStateWithCache;

export async function addXP(childId: string, amount: number) {
  const levelState = await getLevelState(childId);
  const newXP = levelState.xp + amount;
  
  // Calculate new level based on XP
  let newLevel = levelState.level;
  for (let i = LEVEL_XP_REQUIREMENTS.length - 1; i >= 0; i--) {
    if (newXP >= LEVEL_XP_REQUIREMENTS[i]) {
      newLevel = Math.min(i + 1, 3); // Cap at level 3 for now
      break;
    }
  }

  // Check level-specific unlock requirements
  if (newLevel === 2 && levelState.level === 1) {
    // Check if Level 1 (letters) is complete
    const { checkLevel1Complete } = await import('./letters');
    const level1Complete = await checkLevel1Complete(childId);
    if (!level1Complete) {
      newLevel = 1; // Stay at level 1 until letters are mastered
    }
  }

  const leveledUp = newLevel > levelState.level;

  await prisma.levelState.update({
    where: { childId },
    data: {
      xp: newXP,
      level: newLevel,
      updatedAt: new Date(),
    },
  });

  // Only revalidate progress page - other pages will update on next navigation
  // This prevents multiple re-renders when completing learning
  revalidatePath('/progress');
  return { level: newLevel, xp: newXP, leveledUp };
}

export async function checkAndUnlockLevel2(childId: string) {
  const levelState = await getLevelState(childId);
  if (levelState.level === 1) {
    const { checkLevel1Complete } = await import('./letters');
    const level1Complete = await checkLevel1Complete(childId);
    if (level1Complete) {
      // Unlock level 2
      await prisma.levelState.update({
        where: { childId },
        data: {
          level: 2,
          updatedAt: new Date(),
        },
      });
      revalidatePath('/learn');
      revalidatePath('/quiz');
      revalidatePath('/progress');
      return true;
    }
  }
  return false;
}

export async function calculateLevelFromProgress(childId: string) {
  const progress = await prisma.progress.findMany({
    where: { childId },
  });

  const masteredWords = progress.filter((p) => p.masteryScore >= 80).length;
  const missions = await prisma.missionState.findMany({
    where: {
      childId,
      completed: true,
    },
  });

  // Calculate XP
  let totalXP = masteredWords * XP_PER_WORD_MASTERED;
  totalXP += missions.length * XP_PER_MISSION;

  // Add streak bonus (simplified - would need streak calculation)
  // This is a placeholder

  return addXP(childId, 0); // Just recalculate level
}

export async function getXPForLevel(level: number): Promise<number> {
  if (level < 1 || level > 3) return 0;
  return LEVEL_XP_REQUIREMENTS[level - 1];
}

export async function getXPForNextLevel(level: number): Promise<number> {
  if (level >= 3) return LEVEL_XP_REQUIREMENTS[2];
  return LEVEL_XP_REQUIREMENTS[level];
}
