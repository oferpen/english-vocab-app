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
      user: {
        findUnique: vi.fn(),
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
    const userId = 'user-1';
    const wordId = 'word-1';
    const wordsCount = 10;
    const xpAmount = 50;

    const mockProgress = {
      id: 'progress-1',
      userId,
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
      userId,
      periodType: 'DAILY' as const,
      missionKey: 'learn_words',
      progress: 0,
      completed: false,
      periodStartDate: '2024-01-01',
      target: wordsCount,
    };

    const mockUser = {
      id: userId,
      level: 1,
      xp: 0,
      updatedAt: new Date(),
    };

    // Mock database calls
    prisma.progress.findUnique.mockResolvedValueOnce(null);
    prisma.progress.create.mockResolvedValue(mockProgress as any);

    prisma.missionState.findUnique.mockResolvedValueOnce(null);
    prisma.missionState.create.mockResolvedValue(mockMission as any);

    prisma.user.findUnique.mockResolvedValueOnce(mockUser as any);

    prisma.progress.update.mockResolvedValue({} as any);
    prisma.missionState.update.mockResolvedValue({} as any);
    prisma.user.update.mockResolvedValue({} as any);

    await completeLearningSession(userId, wordId, wordsCount, xpAmount);

    // Should update all three tables
    expect(prisma.progress.update).toHaveBeenCalledTimes(1);
    expect(prisma.missionState.update).toHaveBeenCalledTimes(1);
    expect(prisma.user.update).toHaveBeenCalledTimes(1);
  });

  it('should prevent duplicate calls when called simultaneously', async () => {
    const userId = 'user-1';
    const wordId = 'word-1';
    const wordsCount = 10;
    const xpAmount = 50;

    const mockProgress = { id: 'p1', userId, wordId, timesSeenInLearn: 0 };
    const mockMission = { id: 'm1', userId, progress: 0 };
    const mockUser = { id: userId, level: 1, xp: 0 };

    prisma.progress.findUnique.mockResolvedValue(mockProgress);
    prisma.missionState.findUnique.mockResolvedValue(mockMission);
    prisma.user.findUnique.mockResolvedValue(mockUser);

    prisma.progress.update.mockResolvedValue({} as any);
    prisma.missionState.update.mockResolvedValue({} as any);
    prisma.user.update.mockResolvedValue({} as any);

    // Call 3 times simultaneously
    const promises = [
      completeLearningSession(userId, wordId, wordsCount, xpAmount),
      completeLearningSession(userId, wordId, wordsCount, xpAmount),
      completeLearningSession(userId, wordId, wordsCount, xpAmount),
    ];

    await Promise.all(promises);

    // Should only update once per table
    expect(prisma.progress.update).toHaveBeenCalledTimes(1);
    expect(prisma.missionState.update).toHaveBeenCalledTimes(1);
    expect(prisma.user.update).toHaveBeenCalledTimes(1);
  });
});
