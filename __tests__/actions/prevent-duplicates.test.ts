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
    // Import fresh modules
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
      const userId = 'user-1';
      const wordId = 'word-1';
      const mockProgress = { id: 'p1', userId, wordId, timesSeenInLearn: 0 };

      vi.mocked(prisma.progress.findUnique).mockResolvedValueOnce(null).mockResolvedValue(mockProgress);
      vi.mocked(prisma.progress.create).mockResolvedValue(mockProgress);
      vi.mocked(prisma.progress.update).mockResolvedValue({ ...mockProgress, timesSeenInLearn: 1 });

      const promises = [
        markWordSeen(userId, wordId),
        markWordSeen(userId, wordId),
        markWordSeen(userId, wordId),
      ];

      await Promise.all(promises);
      expect(prisma.progress.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('recordQuizAttempt', () => {
    it('should only call database once when called 3 times simultaneously', async () => {
      const userId = 'user-1';
      const wordId = 'word-1';
      const mockProgress = { id: 'p1', userId, wordId, quizAttempts: 0, quizCorrect: 0 };

      vi.mocked(prisma.progress.findUnique).mockResolvedValue(mockProgress);
      vi.mocked(prisma.quizAttempt.create).mockResolvedValue({});
      vi.mocked(prisma.progress.update).mockResolvedValue({});

      const promises = [
        recordQuizAttempt(userId, wordId, 'EN_TO_HE', true, false),
        recordQuizAttempt(userId, wordId, 'EN_TO_HE', true, false),
        recordQuizAttempt(userId, wordId, 'EN_TO_HE', true, false),
      ];

      await Promise.all(promises);
      expect(prisma.quizAttempt.create).toHaveBeenCalledTimes(1);
      expect(prisma.progress.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('completeLearningSession', () => {
    it('should only call database once per table when called 3 times simultaneously', async () => {
      const userId = 'user-1';
      const wordId = 'word-1';
      const mockProgress = { id: 'p1', userId, wordId, timesSeenInLearn: 0 };
      const mockMission = { id: 'm1', userId, progress: 0 };
      const mockUser = { id: userId, level: 1, xp: 0 };

      vi.mocked(prisma.progress.findUnique).mockResolvedValue(mockProgress);
      vi.mocked(prisma.missionState.findUnique).mockResolvedValue(mockMission);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.progress.update).mockResolvedValue({});
      vi.mocked(prisma.missionState.update).mockResolvedValue({});
      vi.mocked(prisma.user.update).mockResolvedValue({});

      const promises = [
        completeLearningSession(userId, wordId, 10, 50),
        completeLearningSession(userId, wordId, 10, 50),
        completeLearningSession(userId, wordId, 10, 50),
      ];

      await Promise.all(promises);
      expect(prisma.progress.update).toHaveBeenCalledTimes(1);
      expect(prisma.missionState.update).toHaveBeenCalledTimes(1);
      expect(prisma.user.update).toHaveBeenCalledTimes(1);
    });
  });
});
