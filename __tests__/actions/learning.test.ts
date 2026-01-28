import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', async () => {
  const { vi } = await import('vitest');
  return {
    prisma: {
      progress: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      missionState: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      levelState: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    },
  };
});

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/utils', () => ({
  getTodayDate: vi.fn().mockReturnValue('2024-01-01'),
}));

vi.mock('@/app/actions/letters', () => ({
  checkLevel1Complete: vi.fn().mockResolvedValue(true),
}));

describe('completeLearningSession', () => {
  let completeLearningSession: any;
  let prisma: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    // Import after reset to get fresh modules with cleared caches
    const learningModule = await import('@/app/actions/learning');
    completeLearningSession = learningModule.completeLearningSession;

    const prismaModule = await import('@/lib/prisma');
    prisma = prismaModule.prisma;
  });

  it('should combine all operations into a single call', async () => {
    const childId = 'child-1';
    const wordId = 'word-1';
    const wordsCount = 10;
    const xpAmount = 50;

    const mockProgress = {
      id: 'progress-1',
      childId,
      wordId,
      timesSeenInLearn: 0,
      quizAttempts: 0,
      quizCorrect: 0,
      masteryScore: 0,
      needsReview: false,
      lastSeenAt: new Date(),
    };

    const mockMission = {
      id: 'mission-1',
      childId,
      periodType: 'DAILY' as const,
      missionKey: 'learn_words',
      progress: 0,
      completed: false,
      periodStartDate: '2024-01-01',
      target: wordsCount,
    };

    const mockLevelState = {
      id: 'level-1',
      childId,
      level: 1,
      xp: 0,
      updatedAt: new Date(),
    };

    // Mock database calls - completeLearningSession does inline get-or-create
    // It calls findUnique for all three in parallel, then creates if null
    prisma.progress.findUnique.mockResolvedValueOnce(null); // Doesn't exist, will create
    prisma.progress.create.mockResolvedValue(mockProgress as any);

    prisma.missionState.findUnique.mockResolvedValueOnce(null); // Doesn't exist, will create
    prisma.missionState.create.mockResolvedValue(mockMission as any);

    prisma.levelState.findUnique.mockResolvedValueOnce(mockLevelState as any); // Exists

    prisma.progress.update.mockResolvedValue({
      timesSeenInLearn: 1,
    } as any);
    prisma.missionState.update.mockResolvedValue({
      progress: 1,
      completed: false,
    } as any);
    prisma.levelState.update.mockResolvedValue({
      level: 1,
      xp: 50,
    } as any);

    await completeLearningSession(childId, wordId, wordsCount, xpAmount);

    // Should update all three tables
    expect(prisma.progress.update).toHaveBeenCalledTimes(1);
    expect(prisma.missionState.update).toHaveBeenCalledTimes(1);
    expect(prisma.levelState.update).toHaveBeenCalledTimes(1);
  });

  it('should prevent duplicate calls when called simultaneously', async () => {
    const childId = 'child-1';
    const wordId = 'word-1';
    const wordsCount = 10;
    const xpAmount = 50;

    const mockProgress = {
      id: 'progress-1',
      childId,
      wordId,
      timesSeenInLearn: 0,
      quizAttempts: 0,
      quizCorrect: 0,
      masteryScore: 0,
      needsReview: false,
      lastSeenAt: new Date(),
    };

    const mockMission = {
      id: 'mission-1',
      childId,
      periodType: 'DAILY' as const,
      missionKey: 'learn_words',
      progress: 0,
      completed: false,
      periodStartDate: '2024-01-01',
      target: wordsCount,
    };

    const mockLevelState = {
      id: 'level-1',
      childId,
      level: 1,
      xp: 0,
      updatedAt: new Date(),
    };

    // Mock getOrCreateProgress pattern
    prisma.progress.findUnique.mockResolvedValueOnce(null);
    prisma.progress.create.mockResolvedValue(mockProgress as any);

    // Mock getOrCreateMissionState pattern
    prisma.missionState.findUnique.mockResolvedValueOnce(null);
    prisma.missionState.create.mockResolvedValue(mockMission as any);

    prisma.levelState.findUnique.mockResolvedValueOnce(mockLevelState as any);

    prisma.progress.update.mockResolvedValue({} as any);
    prisma.missionState.update.mockResolvedValue({} as any);
    prisma.levelState.update.mockResolvedValue({} as any);

    // Call 3 times simultaneously (simulating React Strict Mode)
    const promises = [
      completeLearningSession(childId, wordId, wordsCount, xpAmount),
      completeLearningSession(childId, wordId, wordsCount, xpAmount),
      completeLearningSession(childId, wordId, wordsCount, xpAmount),
    ];

    await Promise.all(promises);

    // Should only update once per table, not 3 times
    expect(prisma.progress.update).toHaveBeenCalledTimes(1);
    expect(prisma.missionState.update).toHaveBeenCalledTimes(1);
    expect(prisma.levelState.update).toHaveBeenCalledTimes(1);
  });

  it('should return the same promise for concurrent calls', async () => {
    const childId = 'child-1';
    const wordId = 'word-1';
    const wordsCount = 10;
    const xpAmount = 50;

    const mockProgress = {
      id: 'progress-1',
      childId,
      wordId,
      timesSeenInLearn: 0,
      quizAttempts: 0,
      quizCorrect: 0,
      masteryScore: 0,
      needsReview: false,
      lastSeenAt: new Date(),
    };

    const mockMission = {
      id: 'mission-1',
      childId,
      periodType: 'DAILY' as const,
      missionKey: 'learn_words',
      progress: 0,
      completed: false,
      periodStartDate: '2024-01-01',
      target: wordsCount,
    };

    const mockLevelState = {
      id: 'level-1',
      childId,
      level: 1,
      xp: 0,
      updatedAt: new Date(),
    };

    prisma.progress.findUnique.mockResolvedValueOnce(null);
    prisma.progress.create.mockResolvedValue(mockProgress as any);

    prisma.missionState.findUnique.mockResolvedValueOnce(null);
    prisma.missionState.create.mockResolvedValue(mockMission as any);

    prisma.levelState.findUnique.mockResolvedValueOnce(mockLevelState as any);

    prisma.progress.update.mockResolvedValue({} as any);
    prisma.missionState.update.mockResolvedValue({} as any);
    prisma.levelState.update.mockResolvedValue({} as any);

    // Call simultaneously
    const promise1 = completeLearningSession(childId, wordId, wordsCount, xpAmount);
    const promise2 = completeLearningSession(childId, wordId, wordsCount, xpAmount);
    const promise3 = completeLearningSession(childId, wordId, wordsCount, xpAmount);

    // All promises should resolve
    const results = await Promise.all([promise1, promise2, promise3]);

    // All should return the same result structure
    expect(results[0]).toHaveProperty('success');
    expect(results[1]).toHaveProperty('success');
    expect(results[2]).toHaveProperty('success');

    // Should only update once per table
    expect(prisma.progress.update).toHaveBeenCalledTimes(1);
    expect(prisma.missionState.update).toHaveBeenCalledTimes(1);
    expect(prisma.levelState.update).toHaveBeenCalledTimes(1);
  });
});
