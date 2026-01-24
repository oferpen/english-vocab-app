'use server';

import { prisma } from '@/lib/prisma';
import { getOrCreateProgress } from './progress';
import { getOrCreateMissionState } from './missions';
import { getLevelState } from './levels';
import { getTodayDate } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

const LEVEL_XP_REQUIREMENTS = [
  0,    // Level 1 (Letters) - unlocked by default
  50,   // Level 2 (Basic words) - unlock after mastering 20 letters
  150,  // Level 3 (Less basic words) - unlock after mastering 50 basic words
];

function getWeekStartDate(date: string): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

/**
 * Complete learning session - marks word as seen, updates mission progress, and adds XP
 * This combines all operations into a single server action to reduce HTTP requests from 3 to 1
 */
export async function completeLearningSession(
  childId: string,
  wordId: string,
  wordsCount: number,
  xpAmount: number
) {
  // Perform all database operations in parallel
  const [progress, mission, levelState] = await Promise.all([
    // Get or create progress
    getOrCreateProgress(childId, wordId),
    // Get or create mission state
    (async () => {
      const today = getTodayDate();
      const periodStartDate = 'DAILY' === 'DAILY' ? today : getWeekStartDate(today);
      return getOrCreateMissionState(childId, 'DAILY', 'learn_words', wordsCount, periodStartDate);
    })(),
    // Get level state
    getLevelState(childId),
  ]);

  // Calculate new values
  const newProgressTimesSeen = progress.timesSeenInLearn + 1;
  const newMissionProgress = Math.min(mission.progress + 1, wordsCount);
  const newMissionCompleted = newMissionProgress >= wordsCount;
  const newXP = levelState.xp + xpAmount;
  
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

  // Update all records in parallel
  await Promise.all([
    // Update progress
    prisma.progress.update({
      where: { id: progress.id },
      data: {
        timesSeenInLearn: newProgressTimesSeen,
        lastSeenAt: new Date(),
      },
    }),
    // Update mission
    prisma.missionState.update({
      where: { id: mission.id },
      data: {
        progress: newMissionProgress,
        completed: newMissionCompleted,
      },
    }),
    // Update level state
    prisma.levelState.update({
      where: { childId },
      data: {
        xp: newXP,
        level: newLevel,
        updatedAt: new Date(),
      },
    }),
  ]);

  // Only revalidate progress page once
  revalidatePath('/progress');
  
  return { 
    success: true,
    leveledUp: newLevel > levelState.level,
    newLevel,
    newXP,
  };
}
