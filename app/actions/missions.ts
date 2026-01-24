'use server';

import { prisma } from '@/lib/prisma';
import { getTodayDate } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

export async function getMissionState(
  childId: string,
  periodType: 'DAILY' | 'WEEKLY',
  missionKey: string,
  periodStartDate: string
) {
  return prisma.missionState.findUnique({
    where: {
      childId_periodType_missionKey_periodStartDate: {
        childId,
        periodType,
        missionKey,
        periodStartDate,
      },
    },
  });
}

export async function getOrCreateMissionState(
  childId: string,
  periodType: 'DAILY' | 'WEEKLY',
  missionKey: string,
  target: number,
  periodStartDate: string
) {
  let mission = await getMissionState(childId, periodType, missionKey, periodStartDate);
  
  if (!mission) {
    mission = await prisma.missionState.create({
      data: {
        childId,
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
  childId: string,
  periodType: 'DAILY' | 'WEEKLY',
  missionKey: string,
  target: number,
  progressDelta: number = 1,
  skipRevalidate: boolean = false
) {
  const today = getTodayDate();
  const periodStartDate = periodType === 'DAILY' ? today : getWeekStartDate(today);

  const mission = await getOrCreateMissionState(
    childId,
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

export async function getAllMissions(childId: string) {
  const today = getTodayDate();
  const weekStart = getWeekStartDate(today);

  return prisma.missionState.findMany({
    where: {
      childId,
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
