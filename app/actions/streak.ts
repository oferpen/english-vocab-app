'use server';

import { prisma } from '@/lib/prisma';
import { getTodayDate } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

export async function getStreak(childId: string): Promise<number> {
  // Get all quiz attempts and learn sessions
  const today = getTodayDate();
  
  // This is simplified - in production you'd track daily completion
  // For now, check if there's activity today and yesterday
  const progress = await prisma.progress.findMany({
    where: {
      childId,
      lastSeenAt: {
        gte: new Date(new Date().setDate(new Date().getDate() - 30)),
      },
    },
    orderBy: {
      lastSeenAt: 'desc',
    },
  });

  // Group by date
  const dates = new Set<string>();
  progress.forEach((p) => {
    if (p.lastSeenAt) {
      const dateStr = p.lastSeenAt.toISOString().split('T')[0];
      dates.add(dateStr);
    }
  });

  // Calculate streak
  let streak = 0;
  const sortedDates = Array.from(dates).sort().reverse();
  const todayDate = new Date(today);
  
  for (let i = 0; i < sortedDates.length; i++) {
    const checkDate = new Date(todayDate);
    checkDate.setDate(checkDate.getDate() - i);
    const checkDateStr = checkDate.toISOString().split('T')[0];
    
    if (sortedDates.includes(checkDateStr)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export async function checkDailyCompletion(childId: string, type: 'learn' | 'quiz'): Promise<boolean> {
  const today = getTodayDate();
  const plan = await prisma.dailyPlan.findUnique({
    where: {
      childId_date: {
        childId,
        date: today,
      },
    },
    include: {
      words: true,
    },
  });

  if (!plan) return false;

  if (type === 'learn') {
    // Check if all words were seen today
    const progress = await prisma.progress.findMany({
      where: {
        childId,
        wordId: {
          in: plan.words.map((w) => w.wordId),
        },
        lastSeenAt: {
          gte: new Date(today + 'T00:00:00'),
        },
      },
    });
    return progress.length >= plan.words.length;
  } else {
    // Check if quiz was completed today
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        childId,
        wordId: {
          in: plan.words.map((w) => w.wordId),
        },
        isExtra: false,
        createdAt: {
          gte: new Date(today + 'T00:00:00'),
        },
      },
    });
    return attempts.length >= plan.words.length;
  }
}
