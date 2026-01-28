import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/utils', () => ({
  getTodayDate: vi.fn().mockReturnValue('2024-01-01'),
}));

vi.mock('@/lib/prisma', async () => {
  const { vi } = await import('vitest');
  return {
    prisma: {
      progress: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      quizAttempt: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
      missionState: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
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

vi.mock('@/app/actions/letters', () => ({
  checkLevel1Complete: vi.fn().mockResolvedValue(true),
}));

describe('Duplicate Calls Prevention', () => {
  let markWordSeen: any;
  let recordQuizAttempt: any;
  let completeLearningSession: any;
  let prisma: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset modules to clear promise caches
    vi.resetModules();

    // Import after reset to get fresh modules with cleared caches
    const progressModule = await import('@/app/actions/progress');
    const learningModule = await import('@/app/actions/learning');
    const prismaModule = await import('@/lib/prisma');

    markWordSeen = progressModule.markWordSeen;
    recordQuizAttempt = progressModule.recordQuizAttempt;
    completeLearningSession = learningModule.completeLearningSession;
    prisma = prismaModule.prisma;
  });

  describe('markWordSeen', () => {
    it('should prevent duplicate calls when called simultaneously', async () => {
      const childId = 'child-1';
      const wordId = 'word-1';

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

      // Mock getOrCreateProgress - first call returns null (needs create), subsequent calls return existing
      vi.mocked(prisma.progress.findUnique)
        .mockResolvedValueOnce(null) // First call - doesn't exist
        .mockResolvedValue(mockProgress as any); // Subsequent calls - exists

      vi.mocked(prisma.progress.create).mockResolvedValue(mockProgress as any);
      vi.mocked(prisma.progress.update).mockResolvedValue({
        ...mockProgress,
        timesSeenInLearn: 1,
      } as any);

      // Call the function 3 times simultaneously (simulating React Strict Mode)
      const promises = [
        markWordSeen(childId, wordId),
        markWordSeen(childId, wordId),
        markWordSeen(childId, wordId),
      ];

      await Promise.all(promises);

      // Should only call update once, not 3 times
      expect(prisma.progress.update).toHaveBeenCalledTimes(1);
    });

    it('should return the same promise for concurrent calls', async () => {
      const childId = 'child-1';
      const wordId = 'word-1';

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

      vi.mocked(prisma.progress.findUnique)
        .mockResolvedValueOnce(null)
        .mockResolvedValue(mockProgress as any);
      vi.mocked(prisma.progress.create).mockResolvedValue(mockProgress as any);
      vi.mocked(prisma.progress.update).mockResolvedValue({
        ...mockProgress,
        timesSeenInLearn: 1,
      } as any);

      // Call simultaneously
      const promise1 = markWordSeen(childId, wordId);
      const promise2 = markWordSeen(childId, wordId);
      const promise3 = markWordSeen(childId, wordId);

      // All promises should resolve (not throw)
      await expect(Promise.all([promise1, promise2, promise3])).resolves.toBeDefined();

      // Should only update once
      expect(prisma.progress.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('recordQuizAttempt', () => {
    it('should prevent duplicate calls when called simultaneously', async () => {
      const childId = 'child-1';
      const wordId = 'word-1';

      const mockProgress = {
        id: 'progress-1',
        childId,
        wordId,
        quizAttempts: 0,
        quizCorrect: 0,
        masteryScore: 0,
        needsReview: false,
        timesSeenInLearn: 0,
        lastSeenAt: new Date(),
      };

      // Mock getOrCreateProgress - first call returns null, subsequent calls return existing
      vi.mocked(prisma.progress.findUnique)
        .mockResolvedValueOnce(null) // First call for getOrCreateProgress
        .mockResolvedValue(mockProgress as any); // Subsequent calls

      vi.mocked(prisma.progress.create).mockResolvedValue(mockProgress as any);
      vi.mocked(prisma.quizAttempt.create).mockResolvedValue({} as any);
      vi.mocked(prisma.progress.update).mockResolvedValue({
        ...mockProgress,
        quizAttempts: 1,
        quizCorrect: 1,
        masteryScore: 100,
      } as any);

      // Call 3 times simultaneously
      const promises = [
        recordQuizAttempt(childId, wordId, 'EN_TO_HE', true, false),
        recordQuizAttempt(childId, wordId, 'EN_TO_HE', true, false),
        recordQuizAttempt(childId, wordId, 'EN_TO_HE', true, false),
      ];

      await Promise.all(promises);

      // Should only create quiz attempt once
      expect(prisma.quizAttempt.create).toHaveBeenCalledTimes(1);
      // Should only update progress once
      expect(prisma.progress.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('completeLearningSession', () => {
    it('should prevent duplicate calls when called simultaneously', async () => {
      const childId = 'child-1';
      const wordId = 'word-1';
      const wordsCount = 10;
      const xpAmount = 50;

      // Mock all database calls
      vi.mocked(prisma.progress.findUnique).mockResolvedValue({
        id: 'progress-1',
        childId,
        wordId,
        timesSeenInLearn: 0,
        quizAttempts: 0,
        quizCorrect: 0,
        masteryScore: 0,
        needsReview: false,
        lastSeenAt: new Date(),
      } as any);
      vi.mocked(prisma.missionState.findUnique).mockResolvedValue({
        id: 'mission-1',
        childId,
        periodType: 'DAILY',
        missionKey: 'learn_words',
        progress: 0,
        completed: false,
        periodStartDate: '2024-01-01',
        target: wordsCount,
      } as any);
      vi.mocked(prisma.levelState.findUnique).mockResolvedValue({
        id: 'level-1',
        childId,
        level: 1,
        xp: 0,
        updatedAt: new Date(),
      } as any);
      vi.mocked(prisma.progress.update).mockResolvedValue({} as any);
      vi.mocked(prisma.missionState.update).mockResolvedValue({} as any);
      vi.mocked(prisma.levelState.update).mockResolvedValue({} as any);

      // Call 3 times simultaneously
      const promises = [
        completeLearningSession(childId, wordId, wordsCount, xpAmount),
        completeLearningSession(childId, wordId, wordsCount, xpAmount),
        completeLearningSession(childId, wordId, wordsCount, xpAmount),
      ];

      await Promise.all(promises);

      // Should only update each table once (not 3 times)
      expect(prisma.progress.update).toHaveBeenCalledTimes(1);
      expect(prisma.missionState.update).toHaveBeenCalledTimes(1);
      expect(prisma.levelState.update).toHaveBeenCalledTimes(1);
    });

    it('should return the same promise for concurrent calls', async () => {
      const childId = 'child-1';
      const wordId = 'word-1';
      const wordsCount = 10;
      const xpAmount = 50;

      vi.mocked(prisma.progress.findUnique).mockResolvedValue({
        id: 'progress-1',
        childId,
        wordId,
        timesSeenInLearn: 0,
        quizAttempts: 0,
        quizCorrect: 0,
        masteryScore: 0,
        needsReview: false,
        lastSeenAt: new Date(),
      } as any);
      vi.mocked(prisma.missionState.findUnique).mockResolvedValue({
        id: 'mission-1',
        childId,
        periodType: 'DAILY',
        missionKey: 'learn_words',
        progress: 0,
        completed: false,
        periodStartDate: '2024-01-01',
        target: wordsCount,
      } as any);
      vi.mocked(prisma.levelState.findUnique).mockResolvedValue({
        id: 'level-1',
        childId,
        level: 1,
        xp: 0,
        updatedAt: new Date(),
      } as any);
      vi.mocked(prisma.progress.update).mockResolvedValue({} as any);
      vi.mocked(prisma.missionState.update).mockResolvedValue({} as any);
      vi.mocked(prisma.levelState.update).mockResolvedValue({} as any);

      // Call simultaneously
      const promise1 = completeLearningSession(childId, wordId, wordsCount, xpAmount);
      const promise2 = completeLearningSession(childId, wordId, wordsCount, xpAmount);
      const promise3 = completeLearningSession(childId, wordId, wordsCount, xpAmount);

      // All promises should resolve
      const results = await Promise.all([promise1, promise2, promise3]);

      // All should return the same result structure
      expect(results[0]).toHaveProperty('success');

      // Should only update once per table
      expect(prisma.progress.update).toHaveBeenCalledTimes(1);
      expect(prisma.missionState.update).toHaveBeenCalledTimes(1);
      expect(prisma.levelState.update).toHaveBeenCalledTimes(1);
    });
  });
});
