'use server';

import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCurrentParentAccount } from '@/lib/auth';

export interface AppSettings {
  questionTypes: {
    enToHe: boolean;
    heToEn: boolean;
    audioToEn: boolean;
  };
}

export const getSettings = cache(async (): Promise<AppSettings> => {
  const parentAccount = await getCurrentParentAccount();
  if (!parentAccount) {
    return getDefaultSettings();
  }

  try {
    const parsed = JSON.parse(parentAccount.settingsJson || '{}') as Partial<AppSettings>;
    const defaults = getDefaultSettings();
    
    // Ensure all required fields exist with defaults
    return {
      questionTypes: {
        enToHe: parsed.questionTypes?.enToHe ?? defaults.questionTypes.enToHe,
        heToEn: parsed.questionTypes?.heToEn ?? defaults.questionTypes.heToEn,
        audioToEn: parsed.questionTypes?.audioToEn ?? defaults.questionTypes.audioToEn,
      },
    };
  } catch {
    return getDefaultSettings();
  }
});

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
      audioToEn: false, // Not default - user can enable if they want
    },
  };
}
