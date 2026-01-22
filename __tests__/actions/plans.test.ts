import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTodayPlan, createDailyPlan, generateStarterPack } from '@/app/actions/plans';
import { prisma } from '@/__mocks__/prisma';

vi.mock('@/lib/utils', () => ({
  getTodayDate: () => '2024-01-15',
}));

vi.mock('@/app/actions/levels', () => ({
  getLevelState: vi.fn(() => Promise.resolve({ level: 2, xp: 50 })),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Plans Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTodayPlan', () => {
    it('should return today\'s plan', async () => {
      const mockPlan = {
        id: 'plan-1',
        childId: 'child-1',
        date: '2024-01-15',
        words: [],
      };

      (prisma.dailyPlan.findUnique as any).mockResolvedValue(mockPlan);

      const plan = await getTodayPlan('child-1');
      expect(plan).toEqual(mockPlan);
    });
  });

  describe('createDailyPlan', () => {
    it('should create new daily plan', async () => {
      (prisma.dailyPlan.findUnique as any).mockResolvedValue(null);
      (prisma.dailyPlan.create as any).mockResolvedValue({
        id: 'plan-new',
        childId: 'child-1',
        date: '2024-01-15',
        words: [],
      });

      const plan = await createDailyPlan('child-1', '2024-01-15', ['word-1', 'word-2']);
      expect(plan).toBeDefined();
      expect(prisma.dailyPlan.create).toHaveBeenCalled();
    });

    it('should replace existing plan', async () => {
      (prisma.dailyPlan.findUnique as any).mockResolvedValue({
        id: 'plan-existing',
      });
      (prisma.dailyPlanWord.deleteMany as any).mockResolvedValue({});
      (prisma.dailyPlan.delete as any).mockResolvedValue({});
      (prisma.dailyPlan.create as any).mockResolvedValue({
        id: 'plan-new',
      });

      await createDailyPlan('child-1', '2024-01-15', ['word-1']);
      expect(prisma.dailyPlan.delete).toHaveBeenCalled();
      expect(prisma.dailyPlan.create).toHaveBeenCalled();
    });
  });

  describe('generateStarterPack', () => {
    it('should generate plan with basic words for level 2', async () => {
      (prisma.word.findMany as any).mockResolvedValue([
        { id: 'word-1', difficulty: 1 },
        { id: 'word-2', difficulty: 1 },
      ]);
      (prisma.dailyPlan.findUnique as any).mockResolvedValue(null);
      (prisma.dailyPlan.create as any).mockResolvedValue({
        id: 'plan-1',
        childId: 'child-1',
        date: '2024-01-15',
      });
      (prisma.dailyPlanWord.createMany as any).mockResolvedValue({});

      await generateStarterPack('child-1', '2024-01-15', 10);
      expect(prisma.word.findMany).toHaveBeenCalled();
      expect(prisma.dailyPlan.create).toHaveBeenCalled();
    });
  });
});
