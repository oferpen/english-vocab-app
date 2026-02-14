'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const XP_PER_WORD_MASTERED = 10;
const XP_PER_MISSION = 50;

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

export async function canAccessLevel(userLevel: number, requiredLevel: number): Promise<boolean> {
  return userLevel >= requiredLevel;
}

// Simplified getLevelState helper (optional, can just use user.level/xp)
export async function getLevelState(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { level: true, xp: true },
  });
  return user ? { level: user.level, xp: user.xp } : { level: 1, xp: 0 };
}

export async function addXP(userId: string, amount: number, skipRevalidate: boolean = false) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { level: 1, xp: 0, leveledUp: false };

  const newXP = user.xp + amount;

  // Calculate new level based on XP
  let newLevel = user.level;
  for (let i = LEVEL_XP_REQUIREMENTS.length - 1; i >= 0; i--) {
    if (newXP >= LEVEL_XP_REQUIREMENTS[i]) {
      newLevel = Math.min(i + 1, 3); // Cap at level 3 for now
      break;
    }
  }

  // Check level-specific unlock requirements
  if (newLevel === 2 && user.level === 1) {
    // Check if Level 1 (letters) is complete
    const { checkLevel1Complete } = await import('./content');
    const level1Complete = await checkLevel1Complete(userId);
    if (!level1Complete) {
      newLevel = 1; // Stay at level 1 until letters are mastered
    }
  }

  const leveledUp = newLevel > user.level;

  await prisma.user.update({
    where: { id: userId },
    data: {
      xp: newXP,
      level: newLevel,
    },
  });

  // Only revalidate if not called from combined action
  if (!skipRevalidate) {
    revalidatePath('/progress');
    revalidatePath('/learn/path');
  }
  return { level: newLevel, xp: newXP, leveledUp };
}

export async function checkAndUnlockLevel2(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return false;

  if (user.level === 1) {
    const { checkLevel1Complete } = await import('./content');
    const level1Complete = await checkLevel1Complete(userId);
    if (level1Complete) {
      // Unlock level 2
      await prisma.user.update({
        where: { id: userId },
        data: {
          level: 2,
        },
      });
      revalidatePath('/learn');
      revalidatePath('/learn/path');
      revalidatePath('/quiz');
      revalidatePath('/progress');
      return true;
    }
  }
  return false;
}

export async function calculateLevelFromProgress(userId: string) {
  const progress = await prisma.progress.findMany({
    where: { userId },
  });

  const masteredWords = progress.filter((p) => p.masteryScore >= 80).length;
  // Note: MissionState needs to support userId
  const missions = await prisma.missionState.findMany({
    where: {
      userId,
      completed: true,
    },
  });

  // Calculate XP
  let totalXP = masteredWords * XP_PER_WORD_MASTERED;
  totalXP += missions.length * XP_PER_MISSION;

  // Add streak bonus (simplified - would need streak calculation)
  // This is a placeholder

  return addXP(userId, 0); // Just recalculate level
}

export async function getXPForLevel(level: number): Promise<number> {
  if (level < 1 || level > 3) return 0;
  return LEVEL_XP_REQUIREMENTS[level - 1];
}

export async function getXPForNextLevel(level: number): Promise<number> {
  if (level >= 3) return LEVEL_XP_REQUIREMENTS[2];
  return LEVEL_XP_REQUIREMENTS[level];
}
