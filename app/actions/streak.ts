'use server';

import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { getTodayDate } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

export const getStreak = cache(async (userId: string): Promise<number> => {
  // Get all quiz attempts and learn sessions
  const today = getTodayDate();

  // This is simplified - in production you'd track daily completion
  // For now, check if there's activity today and yesterday
  const progress = await prisma.progress.findMany({
    where: {
      userId,
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
});

export async function checkDailyCompletion(userId: string, type: 'learn' | 'quiz'): Promise<boolean> {
  const today = getTodayDate();
  const todayStart = new Date(today + 'T00:00:00');

  if (type === 'learn') {
    // Check if any words were learned today (lastSeenAt is today)
    const progress = await prisma.progress.findFirst({
      where: {
        userId,
        lastSeenAt: {
          gte: todayStart,
        },
      },
    });
    return !!progress;
  } else {
    // Check if any quiz was completed today (any quiz attempt today)
    const attempts = await prisma.quizAttempt.findFirst({
      where: {
        userId,
        isExtra: false,
        createdAt: {
          gte: todayStart,
        },
      },
    });
    return !!attempts;
  }
}
