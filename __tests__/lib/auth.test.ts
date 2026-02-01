import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCurrentParentAccount } from '@/lib/auth';
import { prisma } from '@/__mocks__/prisma';
import { getAuthSession } from '@/lib/auth-helper';
import { cookies } from 'next/headers';

vi.mock('@/lib/auth-helper', () => ({
    getAuthSession: vi.fn(),
}));

vi.mock('next/headers', () => ({
    cookies: vi.fn(),
}));

describe('lib/auth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getCurrentParentAccount', () => {
        it('should return account for Google session', async () => {
            (getAuthSession as any).mockResolvedValue({ user: { email: 'google@example.com' } });
            (prisma.parentAccount.findUnique as any).mockResolvedValue({ id: 'p1', email: 'google@example.com' });

            const result = await getCurrentParentAccount();
            expect(result.id).toBe('p1');
        });

        it('should return anonymous account for deviceId if no Google session', async () => {
            (getAuthSession as any).mockResolvedValue(null);
            (cookies as any).mockReturnValue({
                get: vi.fn((name) => name === 'deviceId' ? { value: 'anon-id' } : null)
            });

            const anonAccount = { id: 'p-anon', deviceId: 'anon-id', isAnonymous: true };
            (prisma.parentAccount.findUnique as any).mockResolvedValue(anonAccount);

            const result = await getCurrentParentAccount();
            expect(result.id).toBe('p-anon');
        });

        it('should return null if no session and no deviceId (removal of fallback)', async () => {
            (getAuthSession as any).mockResolvedValue(null);
            (cookies as any).mockReturnValue({
                get: vi.fn().mockReturnValue(null)
            });

            // Ensure findFirst is not called anymore (no fallback)
            const result = await getCurrentParentAccount();
            expect(result).toBeNull();
            expect(prisma.parentAccount.findFirst).not.toHaveBeenCalled();
        });
    });
});
