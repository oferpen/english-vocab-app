import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

// Create a stable mock for the cookie store
const mockCookieStore = {
    get: vi.fn(),
};

vi.mock('@/lib/prisma', () => import('@/__mocks__/prisma'));

// Mock next/headers with async cookies()
vi.mock('next/headers', () => ({
    cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

describe('auth-config signIn callback', () => {
    const signInCallback = authOptions.callbacks?.signIn;

    if (typeof signInCallback !== 'function') {
        throw new Error('signIn callback is not a function or not defined');
    }

    beforeEach(() => {
        vi.clearAllMocks();
        mockCookieStore.get.mockReturnValue(null);
    });

    it('should create a new Google user if no user exists for this email', async () => {
        const mockUser = { id: 'u1', email: 'new@example.com', name: 'New User', image: 'img1' };
        const mockAccount: any = { provider: 'google', providerAccountId: 'g1' };

        (prisma.user.findUnique as any).mockResolvedValue(null); // No existing user

        const result = await (signInCallback as any)({ user: mockUser, account: mockAccount });

        expect(result).toBe(true);
        expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                email: 'new@example.com',
                googleId: 'g1',
                name: 'New User',
                image: 'img1'
            })
        }));
    });

    it('should upgrade an anonymous user if they exist and log in with Google', async () => {
        const mockUser = { id: 'u1', email: 'upgrade@example.com', name: 'Upgrade User' };
        const mockAccount: any = { provider: 'google', providerAccountId: 'g1' };

        mockCookieStore.get.mockReturnValue({ value: 'device-1' });

        const anonymousUser = { id: 'anon-1', isAnonymous: true, deviceId: 'device-1' };

        (prisma.user.findUnique as any)
            .mockResolvedValueOnce(null) // No existing user by email
            .mockResolvedValueOnce(anonymousUser); // Found anonymous user by deviceId

        const result = await (signInCallback as any)({ user: mockUser, account: mockAccount });

        expect(result).toBe(true);
        expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'anon-1' },
            data: expect.objectContaining({
                email: 'upgrade@example.com',
                googleId: 'g1',
                isAnonymous: false
            })
        }));
    });

    it('should link additional info to existing Google user on login', async () => {
        const mockUser = { id: 'u1', email: 'existing@example.com', name: 'Updated Name', image: 'new-img' };
        const mockAccount: any = { provider: 'google', providerAccountId: 'g1' };

        const existingUser = { id: 'user-1', email: 'existing@example.com', googleId: null, isAnonymous: false };

        (prisma.user.findUnique as any)
            .mockResolvedValueOnce(existingUser) // Found existing user
            .mockResolvedValueOnce(null); // No device owner (when checking deviceId)

        const result = await (signInCallback as any)({ user: mockUser, account: mockAccount });

        expect(result).toBe(true);
        expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'user-1' },
            data: expect.objectContaining({
                googleId: 'g1',
                name: 'Updated Name',
                image: 'new-img'
            })
        }));
    });
});
