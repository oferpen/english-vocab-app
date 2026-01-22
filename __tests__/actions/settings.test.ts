import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSettings, updateSettings } from '@/app/actions/settings';
import { prisma } from '@/__mocks__/prisma';

const mockGetCurrentParentAccount = vi.fn();

vi.mock('@/lib/auth', () => ({
  getCurrentParentAccount: (...args: any[]) => mockGetCurrentParentAccount(...args),
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
      mockGetCurrentParentAccount.mockResolvedValue({
        id: 'parent-1',
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
      mockGetCurrentParentAccount.mockResolvedValue({
        id: 'parent-1',
        settingsJson: JSON.stringify(mockSettings),
      });

      const settings = await getSettings();
      // The merge should preserve the custom questionTypes
      expect(settings.questionTypes.enToHe).toBe(false);
      expect(settings.questionTypes.heToEn).toBe(true);
      expect(settings.questionTypes.audioToEn).toBe(true);
    });
  });

  describe('updateSettings', () => {
    it('should update settings', async () => {
      mockGetCurrentParentAccount.mockResolvedValue({
        id: 'parent-1',
        settingsJson: '{}',
      });
      (prisma.parentAccount.update as any).mockResolvedValue({
        id: 'parent-1',
        settingsJson: JSON.stringify({ questionTypes: { enToHe: false, heToEn: true, audioToEn: false } }),
      });

      await updateSettings({ questionTypes: { enToHe: false, heToEn: true, audioToEn: false } });
      expect(prisma.parentAccount.update).toHaveBeenCalled();
    });
  });
});
