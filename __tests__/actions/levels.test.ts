import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', async () => {
  const { vi } = await import('vitest');
  return {
    prisma: {
      levelState: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    },
  };
});

vi.mock('@/app/actions/letters', () => ({
  checkLevel1Complete: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Level Actions', () => {
  let getLevelState: any;
  let addXP: any;
  let getXPForLevel: any;
  let prisma: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    const levelsModule = await import('@/app/actions/levels');
    getLevelState = levelsModule.getLevelState;
    addXP = levelsModule.addXP;
    getXPForLevel = levelsModule.getXPForLevel;

    // Get the mocked prisma instance that the app code is using
    const prismaModule = await import('@/lib/prisma');
    prisma = prismaModule.prisma;
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

      prisma.levelState.findUnique.mockResolvedValue(mockLevelState);

      const levelState = await getLevelState('child-1');
      expect(levelState).toEqual(mockLevelState);
    });

    it('should create level state if not exists', async () => {
      prisma.levelState.findUnique.mockResolvedValue(null);
      prisma.levelState.create.mockResolvedValue({
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
      prisma.levelState.findUnique.mockResolvedValue({
        id: 'level-1',
        childId: 'child-1',
        level: 1,
        xp: 40,
        updatedAt: new Date(),
      });
      prisma.levelState.update.mockResolvedValue({
        id: 'level-1',
        childId: 'child-1',
        level: 2,
        xp: 90,
        updatedAt: new Date(),
      });

      const result = await addXP('child-1', 50);
      expect(result.xp).toBe(90);
      expect(result.level).toBe(2);
    });

    it('should not level up if threshold not reached', async () => {
      prisma.levelState.findUnique.mockResolvedValue({
        id: 'level-1',
        childId: 'child-1',
        level: 1,
        xp: 10,
        updatedAt: new Date(),
      });
      prisma.levelState.update.mockResolvedValue({
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
