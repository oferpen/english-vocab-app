'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCurrentParentAccount } from '@/lib/auth';

export interface AppSettings {
  questionTypes: {
    enToHe: boolean;
    heToEn: boolean;
    audioToEn: boolean;
  };
  quizLength: number;
  extraLearningStrategy: 'unseen' | 'needsReview' | 'nextPlanned';
  streakRule: 'learn' | 'quiz' | 'either' | 'both';
  rewardIntensity: 'low' | 'normal' | 'high';
}

export async function getSettings(): Promise<AppSettings> {
  const parentAccount = await getCurrentParentAccount();
  if (!parentAccount) {
    return getDefaultSettings();
  }

  try {
    return JSON.parse(parentAccount.settingsJson) as AppSettings;
  } catch {
    return getDefaultSettings();
  }
}

export async function updateSettings(settings: Partial<AppSettings>) {
  const parentAccount = await getCurrentParentAccount();
  if (!parentAccount) {
    throw new Error('Parent account not found');
  }

  const current = await getSettings();
  const updated = { ...current, ...settings };

  await prisma.parentAccount.update({
    where: { id: parentAccount.id },
    data: {
      settingsJson: JSON.stringify(updated),
    },
  });

  revalidatePath('/parent');
  return updated;
}

function getDefaultSettings(): AppSettings {
  return {
    questionTypes: {
      enToHe: true,
      heToEn: true,
      audioToEn: true,
    },
    quizLength: 10,
    extraLearningStrategy: 'unseen',
    streakRule: 'either',
    rewardIntensity: 'normal',
  };
}
