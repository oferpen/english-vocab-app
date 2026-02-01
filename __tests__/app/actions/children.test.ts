import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllChildren } from '@/app/actions/children';
import { prisma } from '@/__mocks__/prisma';
import { getCurrentParentAccount } from '@/lib/auth';

vi.mock('@/lib/auth', () => ({
    getCurrentParentAccount: vi.fn(),
}));

describe('app/actions/children', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getAllChildren', () => {
        it('should return ONLY children belonging to the current parent account', async () => {
            const mockParent = { id: 'p1' };
            (getCurrentParentAccount as any).mockResolvedValue(mockParent);

            const mockChildren = [{ id: 'c1', parentAccountId: 'p1' }];
            (prisma.childProfile.findMany as any).mockResolvedValue(mockChildren);

            const result = await getAllChildren();

            expect(result).toEqual(mockChildren);
            expect(prisma.childProfile.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: { parentAccountId: 'p1' }
            }));
        });

        it('should return empty array if NO parent account is identified', async () => {
            (getCurrentParentAccount as any).mockResolvedValue(null);

            const result = await getAllChildren();

            expect(result).toEqual([]);
            // Verify it DOES NOT fetch all children
            expect(prisma.childProfile.findMany).not.toHaveBeenCalled();
        });
    });
});
