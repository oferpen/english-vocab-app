import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyPIN, setPIN } from '@/app/actions/auth';
import { prisma } from '@/__mocks__/prisma';
import bcrypt from 'bcryptjs';

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

describe('Auth Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('verifyPIN', () => {
    it('should return true for correct PIN', async () => {
      const pinHash = 'hashed-pin-123';
      (prisma.parentAccount.findMany as any).mockResolvedValue([
        { id: 'parent-1', pinHash },
      ]);
      (bcrypt.compare as any).mockResolvedValue(true);

      const result = await verifyPIN('1234');
      expect(result).toBe(true);
    });

    it('should return false for incorrect PIN', async () => {
      const pinHash = 'hashed-pin-123';
      (prisma.parentAccount.findMany as any).mockResolvedValue([
        { id: 'parent-1', pinHash },
      ]);
      (bcrypt.compare as any).mockResolvedValue(false);

      const result = await verifyPIN('wrong');
      expect(result).toBe(false);
    });

    it('should return false when no parent account found', async () => {
      (prisma.parentAccount.findMany as any).mockResolvedValue([]);

      const result = await verifyPIN('1234');
      expect(result).toBe(false);
    });
  });

  describe('setPIN', () => {
    it('should hash and save PIN', async () => {
      const hashedPin = 'hashed-pin-123';
      (bcrypt.hash as any).mockResolvedValue(hashedPin);
      
      // Mock getAuthSession to return a session
      vi.mock('@/lib/auth-helper', () => ({
        getAuthSession: vi.fn(() => Promise.resolve({ user: { email: 'test@example.com' } })),
      }));
      
      (prisma.parentAccount.findUnique as any).mockResolvedValue({
        id: 'parent-1',
        email: 'test@example.com',
      });
      (prisma.parentAccount.update as any).mockResolvedValue({
        id: 'parent-1',
        pinHash: hashedPin,
      });

      await setPIN('1234');
      expect(bcrypt.hash).toHaveBeenCalledWith('1234', 10);
      expect(prisma.parentAccount.update).toHaveBeenCalled();
    });
  });
});
