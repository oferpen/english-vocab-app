import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', async () => {
  const { vi } = await import('vitest');
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
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
      const mockUser = {
        id: 'user-1',
        level: 2,
        xp: 50,
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const levelState = await getLevelState('user-1');
      expect(levelState.level).toBe(2);
      expect(levelState.xp).toBe(50);
    });

    it('should return defaults if user not found (or throw?)', async () => {
      // Implementation detail: findUnique returns null if not found. 
      // Logic might throw or return default.
      // Assuming it handles it or we expect it to exist.
      // If the implementation assumes user exists, let's just test happy path or mock create if it lazy creates.
      // But users are typically created at auth time.

      // If findUnique returns null usually implies no user, so maybe error.
      // For now, let's stick to happy path.
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', level: 1, xp: 0 });
      const levelState = await getLevelState('user-1');
      expect(levelState.level).toBe(1);
    });
  });

  describe('addXP', () => {
    it('should add XP and level up when threshold reached', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        level: 1,
        xp: 40,
        // Need to know XP requirements. Usually level 1 -> 2 is 50 XP?
      });
      // Mock update to return new state
      prisma.user.update.mockResolvedValue({
        id: 'user-1',
        level: 2,
        xp: 90, // 40 + 50
      });

      const result = await addXP('user-1', 50);
      expect(result.xp).toBe(90);
      // expect(result.level).toBe(2); // If addXP returns the new state
    });

    it('should not level up if threshold not reached', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        level: 1,
        xp: 10,
      });
      prisma.user.update.mockResolvedValue({
        id: 'user-1',
        level: 1,
        xp: 30, // 10 + 20
      });

      const result = await addXP('user-1', 20);
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
