import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getUnseenWords, getWordsNeedingReview } from '@/app/actions/progress';

/**
 * Regression tests for Stale Schema References Bug
 * 
 * Bug: Server actions referenced old `difficulty` field instead of `level` after schema migration.
 * 
 * Root Cause: Incomplete migration - `progress.ts` still used `difficulty` in Prisma queries,
 * causing crashes when the field was removed from the database.
 * 
 * These tests ensure that:
 * 1. getUnseenWords filters by `level` not `difficulty`
 * 2. getWordsNeedingReview uses correct schema fields
 * 3. Queries don't reference non-existent fields
 */

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
            const childId = 'child-1';
            const level = 2;

            // Mock progress data
            (prisma.progress.findMany as any).mockResolvedValue([
                { wordId: 'word-1' },
                { wordId: 'word-2' },
            ]);

            // Mock word data with level field
            (prisma.word.findMany as any).mockResolvedValue([
                {
                    id: 'word-3',
                    englishWord: 'cat',
                    hebrewTranslation: 'חתול',
                    level: 2,
                    active: true,
                },
                {
                    id: 'word-4',
                    englishWord: 'dog',
                    hebrewTranslation: 'כלב',
                    level: 2,
                    active: true,
                },
            ]);

            await getUnseenWords(childId, level);

            // Verify that word.findMany was called with level filter
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

        it('should not include difficulty field in query', async () => {
            const childId = 'child-1';
            const level = 2;

            (prisma.progress.findMany as any).mockResolvedValue([]);
            (prisma.word.findMany as any).mockResolvedValue([]);

            await getUnseenWords(childId, level);

            const callArgs = (prisma.word.findMany as any).mock.calls[0][0];

            // Ensure 'difficulty' is not in the where clause
            expect(callArgs.where).not.toHaveProperty('difficulty');
            expect(callArgs.where).toHaveProperty('level');
        });

        it('should work when level is undefined (all levels)', async () => {
            const childId = 'child-1';

            (prisma.progress.findMany as any).mockResolvedValue([]);
            (prisma.word.findMany as any).mockResolvedValue([
                { id: 'word-1', level: 1, active: true },
                { id: 'word-2', level: 2, active: true },
                { id: 'word-3', level: 3, active: true },
            ]);

            await getUnseenWords(childId);

            const callArgs = (prisma.word.findMany as any).mock.calls[0][0];

            // When level is undefined, it should not be in the where clause
            expect(callArgs.where).not.toHaveProperty('level');
            expect(callArgs.where).not.toHaveProperty('difficulty');
        });

        it('should handle level 1 correctly', async () => {
            const childId = 'child-1';
            const level = 1;

            (prisma.progress.findMany as any).mockResolvedValue([]);
            (prisma.word.findMany as any).mockResolvedValue([
                {
                    id: 'word-1',
                    englishWord: 'Big',
                    hebrewTranslation: 'גדול',
                    level: 1,
                    active: true,
                },
            ]);

            await getUnseenWords(childId, level);

            expect(prisma.word.findMany).toHaveBeenCalledWith({
                where: {
                    active: true,
                    id: {
                        notIn: [],
                    },
                    level: 1,
                },
            });
        });

        it('should handle level 3 correctly', async () => {
            const childId = 'child-1';
            const level = 3;

            (prisma.progress.findMany as any).mockResolvedValue([]);
            (prisma.word.findMany as any).mockResolvedValue([
                {
                    id: 'word-1',
                    englishWord: 'advanced',
                    hebrewTranslation: 'מתקדם',
                    level: 3,
                    active: true,
                },
            ]);

            await getUnseenWords(childId, level);

            expect(prisma.word.findMany).toHaveBeenCalledWith({
                where: {
                    active: true,
                    id: {
                        notIn: [],
                    },
                    level: 3,
                },
            });
        });
    });

    describe('getWordsNeedingReview', () => {
        it('should not reference difficulty field in queries', async () => {
            const childId = 'child-1';

            (prisma.progress.findMany as any).mockResolvedValue([
                {
                    wordId: 'word-1',
                    word: {
                        id: 'word-1',
                        englishWord: 'cat',
                        hebrewTranslation: 'חתול',
                        level: 2,
                    },
                },
            ]);

            await getWordsNeedingReview(childId);

            const callArgs = (prisma.progress.findMany as any).mock.calls[0][0];

            // Ensure the query structure doesn't reference difficulty
            expect(JSON.stringify(callArgs)).not.toContain('difficulty');
        });

        it('should include word relation with correct fields', async () => {
            const childId = 'child-1';

            (prisma.progress.findMany as any).mockResolvedValue([
                {
                    wordId: 'word-1',
                    needsReview: true,
                    word: {
                        id: 'word-1',
                        englishWord: 'cat',
                        hebrewTranslation: 'חתול',
                        level: 2,
                        category: 'Animals',
                    },
                },
            ]);

            const result = await getWordsNeedingReview(childId);

            expect(result).toHaveLength(1);
            expect(result[0].word).toHaveProperty('level');
            expect(result[0].word).not.toHaveProperty('difficulty');
        });

        it('should filter by needsReview flag', async () => {
            const childId = 'child-1';

            (prisma.progress.findMany as any).mockResolvedValue([
                {
                    wordId: 'word-1',
                    needsReview: true,
                    word: { id: 'word-1', level: 2 },
                },
            ]);

            await getWordsNeedingReview(childId);

            expect(prisma.progress.findMany).toHaveBeenCalledWith({
                where: {
                    childId: 'child-1',
                    needsReview: true,
                },
                include: {
                    word: true,
                },
            });
        });
    });

    describe('Schema Field Validation', () => {
        it('should use level consistently across all queries', async () => {
            const childId = 'child-1';

            // Test getUnseenWords
            (prisma.progress.findMany as any).mockResolvedValue([]);
            (prisma.word.findMany as any).mockResolvedValue([]);
            await getUnseenWords(childId, 2);

            // Test getWordsNeedingReview
            (prisma.progress.findMany as any).mockResolvedValue([]);
            await getWordsNeedingReview(childId);

            // Check all calls
            const allCalls = [
                ...(prisma.word.findMany as any).mock.calls,
                ...(prisma.progress.findMany as any).mock.calls,
            ];

            // Ensure no call references 'difficulty'
            allCalls.forEach((call) => {
                const callString = JSON.stringify(call);
                expect(callString).not.toContain('difficulty');
            });
        });

        it('should handle words with only level field (no difficulty)', async () => {
            const childId = 'child-1';

            (prisma.progress.findMany as any).mockResolvedValue([]);
            (prisma.word.findMany as any).mockResolvedValue([
                {
                    id: 'word-1',
                    englishWord: 'cat',
                    hebrewTranslation: 'חתול',
                    level: 2,
                    // No difficulty field
                    active: true,
                },
            ]);

            const result = await getUnseenWords(childId, 2);

            expect(result).toHaveLength(1);
            expect(result[0]).toHaveProperty('level');
            expect(result[0]).not.toHaveProperty('difficulty');
        });
    });

    describe('Error Handling', () => {
        it('should handle database errors gracefully', async () => {
            const childId = 'child-1';

            (prisma.progress.findMany as any).mockRejectedValue(new Error('Database error'));

            await expect(getUnseenWords(childId, 2)).rejects.toThrow('Database error');
        });

        it('should handle empty results', async () => {
            const childId = 'child-1';

            (prisma.progress.findMany as any).mockResolvedValue([]);
            (prisma.word.findMany as any).mockResolvedValue([]);

            const result = await getUnseenWords(childId, 2);

            expect(result).toEqual([]);
        });
    });
});
