'use server';

import { markWordSeen } from './progress';
import { updateMissionProgress } from './missions';
import { addXP } from './levels';
import { revalidatePath } from 'next/cache';

/**
 * Complete learning session - marks word as seen, updates mission progress, and adds XP
 * This combines multiple server actions into one to reduce HTTP requests from 3 to 1
 */
export async function completeLearningSession(
  childId: string,
  wordId: string,
  wordsCount: number,
  xpAmount: number
) {
  // Run all updates in parallel with skipRevalidate flag to prevent multiple revalidations
  await Promise.all([
    markWordSeen(childId, wordId, true), // skipRevalidate = true
    updateMissionProgress(childId, 'DAILY', 'learn_words', wordsCount, 1, true), // skipRevalidate = true
    addXP(childId, xpAmount, true), // skipRevalidate = true
  ]);

  // Only revalidate progress page once instead of multiple times
  revalidatePath('/progress');
  
  return { success: true };
}
