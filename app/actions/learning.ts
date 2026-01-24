'use server';

import { prisma } from '@/lib/prisma';
import { getTodayDate } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

const LEVEL_XP_REQUIREMENTS = [
  0,    // Level 1 (Letters) - unlocked by default
  50,   // Level 2 (Basic words) - unlock after mastering 20 letters
  150,  // Level 3 (Less basic words) - unlock after mastering 50 basic words
];

// Module-level cache to prevent duplicate calls (e.g., from React Strict Mode)
// Use Map with timestamp to track recent calls
const processingSessions = new Map<string, number>();

/**
 * Complete learning session - marks word as seen, updates mission progress, and adds XP
 * This performs all operations directly without calling other server actions to reduce HTTP requests from 3 to 1
 */
export async function completeLearningSession(
  childId: string,
  wordId: string,
  wordsCount: number,
  xpAmount: number
) {
  // Create session key (without timestamp for deduplication)
  const sessionKey = `${childId}-${wordId}`;
  const now = Date.now();
  
  // Check if we're already processing this session (within last 1 second)
  const lastCallTime = processingSessions.get(sessionKey);
  if (lastCallTime && now - lastCallTime < 1000) {
    // Already processing, return early
    return { success: true, skipped: true };
  }
  
  // Mark as processing with current timestamp
  processingSessions.set(sessionKey, now);
  
  // Clean up old entries (older than 5 seconds)
  for (const [key, timestamp] of processingSessions.entries()) {
    if (now - timestamp > 5000) {
      processingSessions.delete(key);
    }
  }
  
  try {
    const today = getTodayDate();
    
    // Perform all database reads in parallel
    const [progress, mission, levelState] = await Promise.all([
    // Get or create progress
    (async () => {
      let progress = await prisma.progress.findUnique({
        where: {
          childId_wordId: {
            childId,
            wordId,
          },
        },
      });
      
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
    })(),
    // Get or create mission state
    (async () => {
      let mission = await prisma.missionState.findUnique({
        where: {
          childId_periodType_missionKey_periodStartDate: {
            childId,
            periodType: 'DAILY',
            missionKey: 'learn_words',
            periodStartDate: today,
          },
        },
      });
      
      if (!mission) {
        mission = await prisma.missionState.create({
          data: {
            childId,
            periodType: 'DAILY',
            missionKey: 'learn_words',
            target: wordsCount,
            progress: 0,
            completed: false,
            periodStartDate: today,
          },
        });
      }
      
      return mission;
    })(),
    // Get or create level state
    (async () => {
      let levelState = await prisma.levelState.findUnique({
        where: { childId },
      });
      
      if (!levelState) {
        levelState = await prisma.levelState.create({
          data: {
            childId,
            level: 1,
            xp: 0,
          },
        });
      }
      
      return levelState;
    })(),
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
  } catch (error) {
    // Remove from processing set on error
    processingSessions.delete(sessionKey);
    throw error;
  }
}
