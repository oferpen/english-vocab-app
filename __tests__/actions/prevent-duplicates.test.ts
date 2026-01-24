import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/utils', () => ({
  getTodayDate: vi.fn().mockReturnValue('2024-01-01'),
}));

vi.mock('@/app/actions/letters', () => ({
  checkLevel1Complete: vi.fn().mockResolvedValue(true),
}));

describe('Prevent Duplicate Server Calls', () => {
  let markWordSeen: any;
  let recordQuizAttempt: any;
  let completeLearningSession: any;
  let prisma: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Don't reset modules - we want to test the promise cache behavior
    const progressModule = await import('@/app/actions/progress');
    const learningModule = await import('@/app/actions/learning');
    const prismaModule = await import('@/__mocks__/prisma');
    
    markWordSeen = progressModule.markWordSeen;
    recordQuizAttempt = progressModule.recordQuizAttempt;
    completeLearningSession = learningModule.completeLearningSession;
    prisma = prismaModule.prisma;
  });

  describe('markWordSeen', () => {
    it('should only call database once when called 3 times simultaneously', async () => {
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
      
      // Mock: first findUnique returns null (needs create), subsequent calls return existing
      vi.mocked(prisma.progress.findUnique)
        .mockResolvedValueOnce(null)
        .mockResolvedValue(mockProgress as any);
      vi.mocked(prisma.progress.create).mockResolvedValue(mockProgress as any);
      vi.mocked(prisma.progress.update).mockResolvedValue({
        ...mockProgress,
        timesSeenInLearn: 1,
      } as any);

      // Call 3 times simultaneously (simulating React Strict Mode)
      const promises = [
        markWordSeen(childId, wordId),
        markWordSeen(childId, wordId),
        markWordSeen(childId, wordId),
      ];

      await Promise.all(promises);

      // Should only call update once, not 3 times (promise cache prevents duplicates)
      expect(prisma.progress.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('recordQuizAttempt', () => {
    it('should only call database once when called 3 times simultaneously', async () => {
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
      
      vi.mocked(prisma.progress.findUnique)
        .mockResolvedValueOnce(null)
        .mockResolvedValue(mockProgress as any);
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

      // Should only create quiz attempt once (promise cache prevents duplicates)
      expect(prisma.quizAttempt.create).toHaveBeenCalledTimes(1);
      expect(prisma.progress.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('completeLearningSession', () => {
    it('should only call database once per table when called 3 times simultaneously', async () => {
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

      // Mock: each findUnique called once per completeLearningSession call
      // But promise cache should make all 3 calls share the same promise
      vi.mocked(prisma.progress.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.progress.create).mockResolvedValue(mockProgress as any);
      
      vi.mocked(prisma.missionState.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.missionState.create).mockResolvedValue(mockMission as any);
      
      vi.mocked(prisma.levelState.findUnique).mockResolvedValueOnce(mockLevelState as any);
      
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

      // Should only update once per table (promise cache prevents duplicates)
      expect(prisma.progress.update).toHaveBeenCalledTimes(1);
      expect(prisma.missionState.update).toHaveBeenCalledTimes(1);
      expect(prisma.levelState.update).toHaveBeenCalledTimes(1);
    });
  });
});
