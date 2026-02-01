import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getUnseenWords, getWordsNeedingReview } from '@/app/actions/progress';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        progress: {
            findMany: vi.fn(),
        },
        word: {
            findMany: vi.fn(),
        },
    },
}));

// Import after mocking
import { prisma } from '@/lib/prisma';

describe('Progress Actions Schema Regression Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('getUnseenWords', () => {
        it('should filter by level field, not difficulty', async () => {
            const userId = 'user-1';
            const level = 2;

            (prisma.progress.findMany as any).mockResolvedValue([
                { wordId: 'word-1' },
                { wordId: 'word-2' },
            ]);

            (prisma.word.findMany as any).mockResolvedValue([
                { id: 'word-3', level: 2, active: true },
                { id: 'word-4', level: 2, active: true },
            ]);

            await getUnseenWords(userId, level);

            expect(prisma.word.findMany).toHaveBeenCalledWith({
                where: {
                    active: true,
                    id: {
                        notIn: ['word-1', 'word-2'],
                    },
                    level: 2,
                },
            });
        });

        it('should use userId consistently', async () => {
            const userId = 'user-1';
            (prisma.progress.findMany as any).mockResolvedValue([]);
            (prisma.word.findMany as any).mockResolvedValue([]);

            await getUnseenWords(userId, 2);

            expect(prisma.progress.findMany).toHaveBeenCalledWith({
                where: { userId },
                select: { wordId: true }
            });
        });
    });

    describe('getWordsNeedingReview', () => {
        it('should filter by userId and needsReview flag', async () => {
            const userId = 'user-1';

            (prisma.progress.findMany as any).mockResolvedValue([]);

            await getWordsNeedingReview(userId);

            expect(prisma.progress.findMany).toHaveBeenCalledWith({
                where: {
                    userId: 'user-1',
                    needsReview: true,
                },
                include: {
                    word: true,
                },
            });
        });
    });
});
