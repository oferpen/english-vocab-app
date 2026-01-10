'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const XP_PER_WORD_MASTERED = 10;
const XP_PER_MISSION = 50;
const XP_PER_STREAK_DAY = 5;

const LEVEL_XP_REQUIREMENTS = [
  0,    // Level 1
  100,  // Level 2
  250,  // Level 3
  450,  // Level 4
  700,  // Level 5
  1000, // Level 6
  1350, // Level 7
  1750, // Level 8
  2200, // Level 9
  2700, // Level 10
];

export async function getLevelState(childId: string) {
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
}

export async function addXP(childId: string, amount: number) {
  const levelState = await getLevelState(childId);
  const newXP = levelState.xp + amount;
  
  // Calculate new level
  let newLevel = levelState.level;
  for (let i = LEVEL_XP_REQUIREMENTS.length - 1; i >= 0; i--) {
    if (newXP >= LEVEL_XP_REQUIREMENTS[i]) {
      newLevel = i + 1;
      break;
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

  revalidatePath('/progress');
  return { level: newLevel, xp: newXP, leveledUp };
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
  if (level < 1 || level > 10) return 0;
  return LEVEL_XP_REQUIREMENTS[level - 1];
}

export async function getXPForNextLevel(level: number): Promise<number> {
  if (level >= 10) return LEVEL_XP_REQUIREMENTS[9];
  return LEVEL_XP_REQUIREMENTS[level];
}
