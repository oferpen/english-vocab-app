import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as lettersActions from '@/app/actions/letters';
import { prisma } from '@/__mocks__/prisma';

const { getAllLetters, markLetterSeen, getUnmasteredLetters, checkLevel1Complete, getAllLetterProgress } = lettersActions;

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
        childId: 'child-1',
        letterId: 'letter-1',
        timesSeen: 1,
        timesCorrect: 1,
        mastered: true,
      });

      const result = await markLetterSeen('child-1', 'letter-1', true);
      expect(result.mastered).toBe(true);
      expect(result.timesSeen).toBe(1);
    });

    it('should update existing progress', async () => {
      (prisma.letterProgress.findUnique as any).mockResolvedValue({
        id: 'progress-1',
        childId: 'child-1',
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

      const result = await markLetterSeen('child-1', 'letter-1', true);
      expect(result.timesSeen).toBe(3);
      expect(result.timesCorrect).toBe(3);
    });

    it('should mark as mastered after 3 correct attempts', async () => {
      (prisma.letterProgress.findUnique as any).mockResolvedValue({
        id: 'progress-1',
        timesSeen: 2,
        timesCorrect: 2,
        mastered: false,
      });
      (prisma.letterProgress.update as any).mockResolvedValue({
        timesSeen: 3,
        timesCorrect: 3,
        mastered: true,
      });

      const result = await markLetterSeen('child-1', 'letter-1', true);
      expect(result.mastered).toBe(true);
    });
  });

  describe('getUnmasteredLetters', () => {
    it('should return only unmastered letters', async () => {
      const allLetters = [
        { id: 'letter-1', letter: 'A', order: 1 },
        { id: 'letter-2', letter: 'B', order: 2 },
        { id: 'letter-3', letter: 'C', order: 3 },
      ];

      // Mock the Prisma calls directly
      (prisma.letter.findMany as any).mockResolvedValue(allLetters);
      (prisma.letterProgress.findMany as any).mockResolvedValue([
        { letterId: 'letter-1', mastered: true, letter: { order: 1 } },
        { letterId: 'letter-2', mastered: false, letter: { order: 2 } },
      ]);

      const unmastered = await getUnmasteredLetters('child-1');
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
      (prisma.letterProgress.findMany as any).mockResolvedValue(
        Array.from({ length: 20 }, (_, i) => ({
          letterId: `letter-${i}`,
          mastered: true,
          letter: { order: i + 1 },
        }))
      );

      const complete = await checkLevel1Complete('child-1');
      expect(complete).toBe(true);
    });

    it('should return false when less than 20 letters mastered', async () => {
      const allLetters = Array.from({ length: 26 }, (_, i) => ({
        id: `letter-${i}`,
        letter: String.fromCharCode(65 + i),
        order: i + 1,
      }));

      (prisma.letter.findMany as any).mockResolvedValue(allLetters);
      (prisma.letterProgress.findMany as any).mockResolvedValue(
        Array.from({ length: 15 }, (_, i) => ({
          letterId: `letter-${i}`,
          mastered: true,
          letter: { order: i + 1 },
        }))
      );

      const complete = await checkLevel1Complete('child-1');
      expect(complete).toBe(false);
    });
  });
});
