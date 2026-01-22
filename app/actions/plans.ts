'use server';

import { prisma } from '@/lib/prisma';
import { getTodayDate } from '@/lib/utils';

export async function getDailyPlan(childId: string, date: string) {
  return prisma.dailyPlan.findUnique({
    where: {
      childId_date: {
        childId,
        date,
      },
    },
    include: {
      words: {
        include: {
          word: true,
        },
      },
    },
  });
}

export async function getTodayPlan(childId: string) {
  return getDailyPlan(childId, getTodayDate());
}

export async function createDailyPlan(childId: string, date: string, wordIds: string[]) {
  // Delete existing plan for this date
  const existing = await prisma.dailyPlan.findUnique({
    where: {
      childId_date: {
        childId,
        date,
      },
    },
  });

  if (existing) {
    await prisma.dailyPlanWord.deleteMany({
      where: { dailyPlanId: existing.id },
    });
    await prisma.dailyPlan.delete({
      where: { id: existing.id },
    });
  }

  const plan = await prisma.dailyPlan.create({
    data: {
      childId,
      date,
      words: {
        create: wordIds.map((wordId) => ({
          wordId,
        })),
      },
    },
    include: {
      words: {
        include: {
          word: true,
        },
      },
    },
  });

  // Note: revalidatePath cannot be called during render in Next.js 16
  // Since pages using this are already marked as 'force-dynamic', 
  // they will automatically re-render on next request
  return plan;
}

export async function generateStarterPack(childId: string, date: string, count: number = 10) {
  // Get child's level to determine which words to show
  const { getLevelState } = await import('./levels');
  const levelState = await getLevelState(childId);
  
  // Level 2 = basic words (difficulty 1), Level 3 = less basic (difficulty 2+)
  // For Level 2, only use difficulty 1 words
  // For Level 3+, use difficulty 2+ words
  const where: any = {
    active: true,
  };
  
  if (levelState.level === 2) {
    where.difficulty = 1;
  } else if (levelState.level >= 3) {
    where.difficulty = { gte: 2 };
  } else {
    // Level 1 (letters) - shouldn't happen, but default to difficulty 1
    where.difficulty = 1;
  }
  
  // Prefer Starter category for Level 2, or basic categories
  const preferredCategories = levelState.level === 2 
    ? ['Starter', 'Colors', 'Animals', 'Body', 'Family'] 
    : ['Home', 'School', 'Nature'];
  
  const preferredWords = await prisma.word.findMany({
    where: {
      ...where,
      category: {
        in: preferredCategories,
      },
    },
    take: count,
  });

  // If not enough words in preferred categories, get from all categories with same difficulty
  if (preferredWords.length < count) {
    const additionalWords = await prisma.word.findMany({
      where,
      take: count - preferredWords.length,
    });
    preferredWords.push(...additionalWords);
  }

  if (preferredWords.length === 0) {
    throw new Error('No words found for starter pack');
  }

  return createDailyPlan(childId, date, preferredWords.map((w) => w.id));
}

export async function autoGeneratePlan(
  childId: string,
  date: string,
  options: {
    difficulty?: number;
    category?: string;
    count?: number;
    preferUnseen?: boolean;
    preferLowMastery?: boolean;
  }
) {
  const { difficulty, category, count = 10, preferUnseen, preferLowMastery } = options;

  // Get child's progress
  const progress = await prisma.progress.findMany({
    where: { childId },
    include: { word: true },
  });

  const progressMap = new Map(progress.map((p) => [p.wordId, p]));

  let words = await prisma.word.findMany({
    where: {
      active: true,
      ...(difficulty && { difficulty }),
      ...(category && { category }),
    },
  });

  // Filter and sort based on preferences
  if (preferUnseen) {
    words = words.filter((w) => !progressMap.has(w.id));
  } else if (preferLowMastery) {
    words = words.sort((a, b) => {
      const progA = progressMap.get(a.id);
      const progB = progressMap.get(b.id);
      const masteryA = progA?.masteryScore || 0;
      const masteryB = progB?.masteryScore || 0;
      return masteryA - masteryB;
    });
  }

  const selectedWords = words.slice(0, count);
  return createDailyPlan(childId, date, selectedWords.map((w) => w.id));
}
