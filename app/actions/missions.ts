'use server';

import { prisma } from '@/lib/prisma';
import { getTodayDate } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

export async function getMissionState(
  userId: string,
  periodType: 'DAILY' | 'WEEKLY',
  missionKey: string,
  periodStartDate: string
) {
  return prisma.missionState.findUnique({
    where: {
      userId_periodType_missionKey_periodStartDate: {
        userId,
        periodType,
        missionKey,
        periodStartDate,
      },
    },
  });
}

export async function getOrCreateMissionState(
  userId: string,
  periodType: 'DAILY' | 'WEEKLY',
  missionKey: string,
  target: number,
  periodStartDate: string
) {
  let mission = await getMissionState(userId, periodType, missionKey, periodStartDate);

  if (!mission) {
    mission = await prisma.missionState.create({
      data: {
        userId,
        periodType,
        missionKey,
        target,
        progress: 0,
        completed: false,
        periodStartDate,
      },
    });
  }

  return mission;
}

export async function updateMissionProgress(
  userId: string,
  periodType: 'DAILY' | 'WEEKLY',
  missionKey: string,
  target: number,
  progressDelta: number = 1,
  skipRevalidate: boolean = false
) {
  const today = getTodayDate();
  const periodStartDate = periodType === 'DAILY' ? today : getWeekStartDate(today);

  const mission = await getOrCreateMissionState(
    userId,
    periodType,
    missionKey,
    target,
    periodStartDate
  );

  const newProgress = Math.min(mission.progress + progressDelta, target);
  const completed = newProgress >= target;

  await prisma.missionState.update({
    where: { id: mission.id },
    data: {
      progress: newProgress,
      completed,
    },
  });

  // Only revalidate if not called from combined action
  if (!skipRevalidate) {
    revalidatePath('/progress');
  }
  return { progress: newProgress, completed };
}

export async function getAllMissions(userId: string) {
  const today = getTodayDate();
  const weekStart = getWeekStartDate(today);

  return prisma.missionState.findMany({
    where: {
      userId,
      OR: [
        { periodType: 'DAILY', periodStartDate: today },
        { periodType: 'WEEKLY', periodStartDate: weekStart },
      ],
    },
    orderBy: [
      { periodType: 'asc' },
      { completed: 'asc' },
    ],
  });
}

function getWeekStartDate(date: string): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}
