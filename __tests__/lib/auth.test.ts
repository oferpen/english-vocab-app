import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCurrentUser } from '@/lib/auth';
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

    describe('getCurrentUser', () => {
        it('should return user for Google session', async () => {
            (getAuthSession as any).mockResolvedValue({ user: { email: 'google@example.com' } });
            (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', email: 'google@example.com' });

            const result = await getCurrentUser();
            expect(result?.id).toBe('u1');
        });

        it('should return anonymous user for deviceId if no Google session', async () => {
            (getAuthSession as any).mockResolvedValue(null);
            (cookies as any).mockReturnValue({
                get: vi.fn((name) => name === 'deviceId' ? { value: 'anon-id' } : null)
            });

            const anonUser = { id: 'u-anon', deviceId: 'anon-id', isAnonymous: true };
            (prisma.user.findUnique as any).mockResolvedValue(anonUser);

            const result = await getCurrentUser();
            expect(result?.id).toBe('u-anon');
        });

        it('should return null if no session and no deviceId', async () => {
            (getAuthSession as any).mockResolvedValue(null);
            (cookies as any).mockReturnValue({
                get: vi.fn().mockReturnValue(null)
            });

            const result = await getCurrentUser();
            expect(result).toBeNull();
        });
    });
});
