import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSettings, updateSettings } from '@/app/actions/settings';
import { prisma } from '@/lib/prisma';

vi.mock('react', () => ({
  cache: (fn: any) => fn,
}));

vi.mock('@/lib/prisma', () => import('@/__mocks__/prisma'));

const mockGetCurrentUser = vi.fn();

vi.mock('@/lib/auth', () => ({
  getCurrentUser: (...args: any[]) => mockGetCurrentUser(...args),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Settings Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSettings', () => {
    it('should return default settings when none exist', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'user-1',
        settingsJson: '{}',
      });

      const settings = await getSettings();
      expect(settings.questionTypes).toBeDefined();
      expect(settings.questionTypes.enToHe).toBe(true);
    });

    it('should merge existing settings with defaults', async () => {
      const mockSettings = {
        questionTypes: {
          enToHe: false,
          heToEn: true,
          audioToEn: true,
        },
      };
      mockGetCurrentUser.mockResolvedValue({
        id: 'user-1',
        settingsJson: JSON.stringify(mockSettings),
      });

      const settings = await getSettings();
      expect(settings.questionTypes.enToHe).toBe(false);
      expect(settings.questionTypes.heToEn).toBe(true);
      expect(settings.questionTypes.audioToEn).toBe(true);
    });
  });

  describe('updateSettings', () => {
    it('should update settings', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'user-1',
        settingsJson: '{}',
      });
      (prisma.user.update as any).mockResolvedValue({
        id: 'user-1',
        settingsJson: JSON.stringify({ questionTypes: { enToHe: false, heToEn: true, audioToEn: false } }),
      });

      await updateSettings({ questionTypes: { enToHe: false, heToEn: true, audioToEn: false } });
      expect(prisma.user.update).toHaveBeenCalled();
    });
  });
});
