import { describe, it, expect, vi, beforeEach } from 'vitest';
import { markWordSeen, recordQuizAttempt, getAllProgress, getWordsNeedingReview, getUnseenWords } from '@/app/actions/progress';
import { prisma } from '@/__mocks__/prisma';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Progress Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('markWordSeen', () => {
    it('should create progress if not exists', async () => {
      (prisma.progress.findUnique as any)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'progress-1',
          childId: 'child-1',
          wordId: 'word-1',
          timesSeenInLearn: 0,
        });
      (prisma.progress.create as any).mockResolvedValue({
        id: 'progress-1',
        childId: 'child-1',
        wordId: 'word-1',
        timesSeenInLearn: 0,
      });
      (prisma.progress.update as any).mockResolvedValue({
        id: 'progress-1',
        timesSeenInLearn: 1,
      });

      await markWordSeen('child-1', 'word-1');
      expect(prisma.progress.create).toHaveBeenCalled();
      expect(prisma.progress.update).toHaveBeenCalled();
    });

    it('should update existing progress', async () => {
      (prisma.progress.findUnique as any).mockResolvedValue({
        id: 'progress-1',
        timesSeenInLearn: 2,
      });
      (prisma.progress.update as any).mockResolvedValue({
        id: 'progress-1',
        timesSeenInLearn: 3,
      });

      await markWordSeen('child-1', 'word-1');
      expect(prisma.progress.update).toHaveBeenCalled();
    });
  });

  describe('recordQuizAttempt', () => {
    it('should record correct quiz attempt', async () => {
      (prisma.progress.findUnique as any)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'progress-1',
          quizAttempts: 0,
          quizCorrect: 0,
        });
      (prisma.progress.create as any).mockResolvedValue({
        id: 'progress-1',
        quizAttempts: 0,
        quizCorrect: 0,
      });
      (prisma.quizAttempt.create as any).mockResolvedValue({});
      (prisma.progress.update as any).mockResolvedValue({
        quizAttempts: 1,
        quizCorrect: 1,
        masteryScore: 100,
      });

      await recordQuizAttempt('child-1', 'word-1', 'EN_TO_HE', true, false);
      expect(prisma.quizAttempt.create).toHaveBeenCalled();
      expect(prisma.progress.update).toHaveBeenCalled();
    });

    it('should calculate mastery score correctly', async () => {
      (prisma.progress.findUnique as any).mockResolvedValue({
        id: 'progress-1',
        quizAttempts: 4,
        quizCorrect: 3,
      });
      (prisma.quizAttempt.create as any).mockResolvedValue({});
      (prisma.progress.update as any).mockResolvedValue({
        quizAttempts: 5,
        quizCorrect: 4,
        masteryScore: 80,
      });

      await recordQuizAttempt('child-1', 'word-1', 'EN_TO_HE', true, false);
      expect(prisma.progress.update).toHaveBeenCalled();
    });

    it('should prevent duplicate calls when called simultaneously', async () => {
      const childId = 'child-1';
      const wordId = 'word-1';
      
      (prisma.progress.findUnique as any)
        .mockResolvedValueOnce(null)
        .mockResolvedValue({
          id: 'progress-1',
          childId,
          wordId,
          quizAttempts: 0,
          quizCorrect: 0,
          masteryScore: 0,
          needsReview: false,
        });
      (prisma.progress.create as any).mockResolvedValue({
        id: 'progress-1',
        quizAttempts: 0,
        quizCorrect: 0,
      });
      (prisma.quizAttempt.create as any).mockResolvedValue({});
      (prisma.progress.update as any).mockResolvedValue({
        quizAttempts: 1,
        quizCorrect: 1,
        masteryScore: 100,
      });

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

  describe('getWordsNeedingReview', () => {
    it('should return words needing review', async () => {
      const mockProgress = [
        { id: 'p1', word: { id: 'word-1', englishWord: 'house' } },
        { id: 'p2', word: { id: 'word-2', englishWord: 'cat' } },
      ];

      (prisma.progress.findMany as any).mockResolvedValue(mockProgress);

      const words = await getWordsNeedingReview('child-1');
      expect(words).toEqual(mockProgress);
      expect(prisma.progress.findMany).toHaveBeenCalledWith({
        where: { childId: 'child-1', needsReview: true },
        include: { word: true },
      });
    });
  });

  describe('getUnseenWords', () => {
    it('should return words not seen by child', async () => {
      (prisma.progress.findMany as any).mockResolvedValue([
        { wordId: 'word-1' },
        { wordId: 'word-2' },
      ]);
      (prisma.word.findMany as any).mockResolvedValue([
        { id: 'word-3', englishWord: 'dog' },
        { id: 'word-4', englishWord: 'bird' },
      ]);

      const words = await getUnseenWords('child-1');
      expect(words).toHaveLength(2);
      expect(words.map((w: any) => w.id)).toEqual(['word-3', 'word-4']);
    });
  });
});
