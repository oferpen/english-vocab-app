import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as lettersActions from '@/app/actions/content';
import { prisma } from '@/lib/prisma';

vi.mock('react', () => ({
  cache: (fn: any) => fn,
}));

vi.mock('@/lib/prisma', () => import('@/__mocks__/prisma'));

const { getAllLetters, markLetterSeen, getUnmasteredLetters, checkLevel1Complete } = lettersActions;

vi.mock('@/app/actions/levels', () => ({
  addXP: vi.fn(() => Promise.resolve({ level: 1, xp: 0 })),
}));

describe('Letters Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllLetters', () => {
    it('should return all active letters', async () => {
      const mockLetters = [
        { id: 'letter-1', letter: 'A', name: 'A', order: 1, active: true },
        { id: 'letter-2', letter: 'B', name: 'Bee', order: 2, active: true },
      ];

      (prisma.letter.findMany as any).mockResolvedValue(mockLetters);

      const letters = await getAllLetters();
      expect(letters).toEqual(mockLetters);
      expect(prisma.letter.findMany).toHaveBeenCalledWith({
        where: { active: true },
        orderBy: { order: 'asc' },
      });
    });
  });

  describe('markLetterSeen', () => {
    it('should create new progress if not exists', async () => {
      (prisma.letterProgress.findUnique as any).mockResolvedValue(null);
      (prisma.letterProgress.create as any).mockResolvedValue({
        id: 'progress-1',
        userId: 'user-1',
        letterId: 'letter-1',
        timesSeen: 1,
        timesCorrect: 1,
        mastered: true,
      });

      const result = await markLetterSeen('user-1', 'letter-1', true);
      expect(result.mastered).toBe(true);
      expect(result.timesSeen).toBe(1);
    });

    it('should update existing progress', async () => {
      (prisma.letterProgress.findUnique as any).mockResolvedValue({
        id: 'progress-1',
        userId: 'user-1',
        letterId: 'letter-1',
        timesSeen: 2,
        timesCorrect: 2,
        mastered: false,
      });
      (prisma.letterProgress.update as any).mockResolvedValue({
        id: 'progress-1',
        timesSeen: 3,
        timesCorrect: 3,
        mastered: true,
      });

      const result = await markLetterSeen('user-1', 'letter-1', true);
      expect(result.timesSeen).toBe(3);
      expect(result.timesCorrect).toBe(3);
    });
  });

  describe('getUnmasteredLetters', () => {
    it('should return only unmastered letters', async () => {
      const allLetters = [
        { id: 'letter-1', letter: 'A', order: 1 },
        { id: 'letter-2', letter: 'B', order: 2 },
        { id: 'letter-3', letter: 'C', order: 3 },
      ];

      (prisma.letter.findMany as any).mockResolvedValue(allLetters);
      (prisma.letterProgress.findMany as any).mockResolvedValue([
        { letterId: 'letter-1', mastered: true, letter: { order: 1 } },
        { letterId: 'letter-2', mastered: false, letter: { order: 2 } },
      ]);

      const unmastered = await getUnmasteredLetters('user-1');
      expect(unmastered.length).toBeGreaterThanOrEqual(1);
      expect(unmastered.some((l: any) => l.id === 'letter-2')).toBe(true);
      expect(unmastered.some((l: any) => l.id === 'letter-3')).toBe(true);
    });
  });

  describe('checkLevel1Complete', () => {
    it('should return true when 20+ letters mastered', async () => {
      const allLetters = Array.from({ length: 26 }, (_, i) => ({
        id: `letter-${i}`,
        letter: String.fromCharCode(65 + i),
        order: i + 1,
      }));

      (prisma.letter.findMany as any).mockResolvedValue(allLetters);
      (prisma.letterProgress.count as any).mockResolvedValue(20);

      const complete = await checkLevel1Complete('user-1');
      expect(complete).toBe(true);
    });
  });
});
