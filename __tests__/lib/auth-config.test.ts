import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/__mocks__/prisma';
import { cookies } from 'next/headers';

vi.mock('next/headers', () => ({
    cookies: vi.fn(),
}));

describe('auth-config signIn callback', () => {
    const signInCallback = authOptions.callbacks?.signIn;

    if (typeof signInCallback !== 'function') {
        throw new Error('signIn callback is not a function or not defined');
    }

    beforeEach(() => {
        vi.clearAllMocks();
        (cookies as any).mockReturnValue({
            get: vi.fn()
        });
    });

    it('should create a new account if no existing or anonymous account exists', async () => {
        const mockUser = { id: 'u1', email: 'new@example.com', name: 'New User' };
        const mockAccount: any = { provider: 'google', providerAccountId: 'g1' };

        (prisma.parentAccount.findUnique as any).mockResolvedValue(null); // No Google account
        // No deviceId cookie mocked in beforeEach

        const result = await (signInCallback as any)({ user: mockUser, account: mockAccount });

        expect(result).toBe(true);
        expect(prisma.parentAccount.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                email: 'new@example.com',
                googleId: 'g1'
            })
        }));
    });

    it('should UPGRADE an anonymous account if deviceId matches and is anonymous', async () => {
        const mockUser = { id: 'u1', email: 'upgrade@example.com', name: 'Upgraded' };
        const mockAccount: any = { provider: 'google', providerAccountId: 'g1' };

        (cookies as any).mockReturnValue({
            get: vi.fn((name) => name === 'deviceId' ? { value: 'anon-device' } : null)
        });

        (prisma.parentAccount.findUnique as any)
            .mockResolvedValueOnce(null) // No Google account yet
            .mockResolvedValueOnce({ id: 'anon-id', isAnonymous: true, deviceId: 'anon-device' }); // Found anonymous account

        const result = await (signInCallback as any)({ user: mockUser, account: mockAccount });

        expect(result).toBe(true);
        expect(prisma.parentAccount.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'anon-id' },
            data: expect.objectContaining({
                email: 'upgrade@example.com',
                isAnonymous: false
            })
        }));
    });

    it('should MERGE anonymous children into existing Google account and delete anonymous parent', async () => {
        const mockUser = { id: 'u1', email: 'existing@example.com' };
        const mockAccount: any = { provider: 'google', providerAccountId: 'g1' };

        (cookies as any).mockReturnValue({
            get: vi.fn((name) => name === 'deviceId' ? { value: 'anon-device' } : null)
        });

        const googleParent = { id: 'google-parent-id', email: 'existing@example.com', isAnonymous: false };
        const anonymousParent = { id: 'anon-parent-id', isAnonymous: true, deviceId: 'anon-device' };

        (prisma.parentAccount.findUnique as any)
            .mockResolvedValueOnce(googleParent) // Found Google account
            .mockResolvedValueOnce(anonymousParent); // Found anonymous account

        const result = await (signInCallback as any)({ user: mockUser, account: mockAccount });

        expect(result).toBe(true);

        // Check children merge
        expect(prisma.childProfile.updateMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { parentAccountId: 'anon-parent-id' },
            data: { parentAccountId: 'google-parent-id' }
        }));

        // Check anonymous account deletion
        expect(prisma.parentAccount.delete).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'anon-parent-id' }
        }));

        // Check association of deviceId to Google account if it was missing
        expect(prisma.parentAccount.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'google-parent-id' },
            data: { deviceId: 'anon-device' }
        }));
    });
});
