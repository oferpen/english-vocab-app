import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getStreak } from '@/app/actions/streak';
import { prisma } from '@/lib/prisma';

vi.mock('react', () => ({
  cache: (fn: any) => fn,
}));

vi.mock('@/lib/prisma', () => import('@/__mocks__/prisma'));

describe('Streak Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStreak', () => {
    it('should calculate streak from progress', async () => {
      const mockProgress = Array.from({ length: 5 }, (_, i) => ({
        lastSeenAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      }));

      (prisma.progress.findMany as any).mockResolvedValue(mockProgress);

      const streak = await getStreak('user-1');
      expect(streak).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 when no progress', async () => {
      (prisma.progress.findMany as any).mockResolvedValue([]);

      const streak = await getStreak('user-1');
      expect(streak).toBe(0);
    });
  });
});
