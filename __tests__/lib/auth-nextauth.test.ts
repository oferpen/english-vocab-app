import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCurrentChild, initAnonymousAccount } from '@/lib/auth-nextauth';
import { prisma } from '@/__mocks__/prisma';
import { getServerSession } from 'next-auth';
import { cookies } from 'next/headers';

vi.mock('next-auth', () => ({
    getServerSession: vi.fn(),
}));

vi.mock('next/headers', () => ({
    cookies: vi.fn(),
}));

// Mock crypto.randomUUID
if (!global.crypto) {
    (global as any).crypto = {
        randomUUID: () => 'new-uuid-123',
    };
} else {
    (global.crypto as any).randomUUID = () => 'new-uuid-123';
}

describe('auth-nextauth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getCurrentChild', () => {
        it('should return child from Google session if available', async () => {
            (getServerSession as any).mockResolvedValue({
                user: { email: 'test@example.com' }
            });

            const mockParentWithChildren = {
                id: 'parent-1',
                email: 'test@example.com',
                isAnonymous: false,
                lastActiveChildId: 'child-1',
                children: [
                    { id: 'child-1', name: 'Child One' }
                ]
            };

            (prisma.parentAccount.findUnique as any).mockResolvedValue(mockParentWithChildren);
            (cookies as any).mockReturnValue({ get: vi.fn() });

            const result = await getCurrentChild();

            expect(result).toEqual(mockParentWithChildren.children[0]);
            expect(prisma.parentAccount.findUnique).toHaveBeenCalledWith(expect.objectContaining({
                where: { email: 'test@example.com' }
            }));
        });

        it('should return child from deviceId for anonymous account if no Google session', async () => {
            (getServerSession as any).mockResolvedValue(null);
            (cookies as any).mockReturnValue({
                get: vi.fn((name) => name === 'deviceId' ? { value: 'device-123' } : null)
            });

            const mockAnonymousParent = {
                id: 'parent-anon',
                deviceId: 'device-123',
                isAnonymous: true,
                lastActiveChildId: 'child-anon',
                children: [
                    { id: 'child-anon', name: 'אני' }
                ]
            };

            (prisma.parentAccount.findFirst as any).mockResolvedValue(mockAnonymousParent);

            const result = await getCurrentChild();

            expect(result).toEqual(mockAnonymousParent.children[0]);
        });

        it('should return null if deviceId belongs to a non-anonymous account', async () => {
            (getServerSession as any).mockResolvedValue(null);
            (cookies as any).mockReturnValue({
                get: vi.fn((name) => name === 'deviceId' ? { value: 'claimed-device' } : null)
            });

            // The database finds a parent, but it's NOT anonymous (isAnonymous: false)
            (prisma.parentAccount.findFirst as any).mockResolvedValue({
                id: 'parent-claimed',
                isAnonymous: false,
                deviceId: 'claimed-device'
            });

            const result = await getCurrentChild();

            expect(result).toBeNull();
        });
    });

    describe('initAnonymousAccount', () => {
        it('should create a new anonymous account and child if deviceId is new', async () => {
            const mockDeviceId = 'brand-new-device';
            (prisma.parentAccount.findUnique as any).mockResolvedValue(null);

            const mockCreatedParent = {
                id: 'new-parent-id',
                deviceId: mockDeviceId,
                isAnonymous: true,
                children: []
            };
            (prisma.parentAccount.create as any).mockResolvedValue(mockCreatedParent);

            const mockCreatedChild = {
                id: 'new-child-id',
                name: 'אני',
                parentAccountId: 'new-parent-id'
            };
            (prisma.childProfile.create as any).mockResolvedValue(mockCreatedChild);

            // Mock the final refresh
            (prisma.parentAccount.findUnique as any)
                .mockResolvedValueOnce(null) // first check
                .mockResolvedValueOnce({ ...mockCreatedParent, children: [mockCreatedChild] }); // final refresh

            const result = await initAnonymousAccount(mockDeviceId);

            expect(prisma.parentAccount.create).toHaveBeenCalled();
            expect(prisma.childProfile.create).toHaveBeenCalled();
            expect(result.children[0]).toEqual(mockCreatedChild);
        });

        it('should return null if current deviceId belongs to a Google account (claimed)', async () => {
            const oldDeviceId = 'claimed-by-google';
            const googleAccount = {
                id: 'google-parent',
                isAnonymous: false,
                deviceId: oldDeviceId,
                children: []
            };

            (prisma.parentAccount.findUnique as any).mockResolvedValue(googleAccount);

            const result = await initAnonymousAccount(oldDeviceId);

            expect(result).toBeNull();
        });
    });
});
