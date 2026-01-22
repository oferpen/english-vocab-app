import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getLevelState, addXP, getXPForLevel, getXPForNextLevel } from '@/app/actions/levels';
import { prisma } from '@/__mocks__/prisma';

vi.mock('@/app/actions/letters', () => ({
  checkLevel1Complete: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Level Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLevelState', () => {
    it('should return existing level state', async () => {
      const mockLevelState = {
        id: 'level-1',
        childId: 'child-1',
        level: 2,
        xp: 50,
        updatedAt: new Date(),
      };

      (prisma.levelState.findUnique as any).mockResolvedValue(mockLevelState);

      const levelState = await getLevelState('child-1');
      expect(levelState).toEqual(mockLevelState);
    });

    it('should create level state if not exists', async () => {
      (prisma.levelState.findUnique as any).mockResolvedValue(null);
      (prisma.levelState.create as any).mockResolvedValue({
        id: 'level-new',
        childId: 'child-1',
        level: 1,
        xp: 0,
        updatedAt: new Date(),
      });

      const levelState = await getLevelState('child-1');
      expect(levelState.level).toBe(1);
      expect(levelState.xp).toBe(0);
    });
  });

  describe('addXP', () => {
    it('should add XP and level up when threshold reached', async () => {
      (prisma.levelState.findUnique as any).mockResolvedValue({
        id: 'level-1',
        childId: 'child-1',
        level: 1,
        xp: 40,
        updatedAt: new Date(),
      });
      (prisma.levelState.update as any).mockResolvedValue({
        id: 'level-1',
        childId: 'child-1',
        level: 2,
        xp: 90,
        updatedAt: new Date(),
      });

      // Mock checkLevel1Complete to return true so level can advance
      const { checkLevel1Complete } = await import('@/app/actions/letters');
      vi.mocked(checkLevel1Complete).mockResolvedValue(true);

      const result = await addXP('child-1', 50);
      expect(result.xp).toBe(90);
      expect(result.level).toBe(2);
    });

    it('should not level up if threshold not reached', async () => {
      (prisma.levelState.findUnique as any).mockResolvedValue({
        id: 'level-1',
        childId: 'child-1',
        level: 1,
        xp: 10,
        updatedAt: new Date(),
      });
      (prisma.levelState.update as any).mockResolvedValue({
        id: 'level-1',
        childId: 'child-1',
        level: 1,
        xp: 30,
        updatedAt: new Date(),
      });

      const result = await addXP('child-1', 20);
      expect(result.level).toBe(1);
      expect(result.xp).toBe(30);
    });
  });

  describe('getXPForLevel', () => {
    it('should return correct XP requirement for level', async () => {
      expect(await getXPForLevel(1)).toBe(0);
      expect(await getXPForLevel(2)).toBe(50);
      expect(await getXPForLevel(3)).toBe(150);
    });
  });
});
