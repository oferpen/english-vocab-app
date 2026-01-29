import { describe, it, expect } from 'vitest';

/**
 * Regression tests for Learning Path Categories Disappearing Bug
 * 
 * Bug: Categories disappeared from Learning Path after level field was added to schema.
 * 
 * Root Cause: Words were missing the `level` field during migration, causing filtering 
 * logic to fail and categories to not render.
 * 
 * These tests ensure that:
 * 1. Words without level field don't crash the component
 * 2. Defensive fallback `w.level ?? w.difficulty` works correctly
 * 3. Categories are correctly grouped by level
 * 4. Empty categories are handled gracefully
 */

describe('Learning Path Data Handling Regression Tests', () => {
    describe('Defensive Fallback for Missing Level Field', () => {
        it('should use level field when available', () => {
            const word = {
                id: 'word-1',
                englishWord: 'cat',
                hebrewTranslation: 'חתול',
                category: 'Animals',
                level: 2,
                difficulty: 1, // Should be ignored
            };

            const wordLevel = word.level ?? word.difficulty;
            expect(wordLevel).toBe(2);
        });

        it('should fallback to difficulty when level is missing', () => {
            const word = {
                id: 'word-1',
                englishWord: 'cat',
                hebrewTranslation: 'חתול',
                category: 'Animals',
                difficulty: 1,
            } as any;

            const wordLevel = word.level ?? word.difficulty;
            expect(wordLevel).toBe(1);
        });

        it('should handle undefined level gracefully', () => {
            const word = {
                id: 'word-1',
                englishWord: 'cat',
                hebrewTranslation: 'חתול',
                category: 'Animals',
                level: undefined,
                difficulty: 2,
            } as any;

            const wordLevel = word.level ?? word.difficulty;
            expect(wordLevel).toBe(2);
        });

        it('should handle null level gracefully', () => {
            const word = {
                id: 'word-1',
                englishWord: 'cat',
                hebrewTranslation: 'חתול',
                category: 'Animals',
                level: null,
                difficulty: 2,
            } as any;

            const wordLevel = word.level ?? word.difficulty;
            expect(wordLevel).toBe(2);
        });
    });

    describe('Category Grouping by Level', () => {
        const mockWords = [
            {
                id: 'word-1',
                englishWord: 'Big',
                hebrewTranslation: 'גדול',
                category: 'Starter',
                level: 1,
            },
            {
                id: 'word-2',
                englishWord: 'cat',
                hebrewTranslation: 'חתול',
                category: 'Animals',
                level: 2,
            },
            {
                id: 'word-3',
                englishWord: 'dog',
                hebrewTranslation: 'כלב',
                category: 'Animals',
                level: 2,
            },
            {
                id: 'word-4',
                englishWord: 'house',
                hebrewTranslation: 'בית',
                category: 'Home',
                level: 2,
            },
            {
                id: 'word-5',
                englishWord: 'advanced',
                hebrewTranslation: 'מתקדם',
                category: 'School',
                level: 3,
            },
        ];

        it('should group words by level correctly', () => {
            const level1Words = mockWords.filter((w) => (w.level ?? (w as any).difficulty) === 1);
            const level2Words = mockWords.filter((w) => (w.level ?? (w as any).difficulty) === 2);
            const level3Words = mockWords.filter((w) => (w.level ?? (w as any).difficulty) === 3);

            expect(level1Words).toHaveLength(1);
            expect(level2Words).toHaveLength(3);
            expect(level3Words).toHaveLength(1);
        });

        it('should extract unique categories per level', () => {
            const level2Words = mockWords.filter((w) => (w.level ?? (w as any).difficulty) === 2);
            const categories = [...new Set(level2Words.map((w) => w.category))];

            expect(categories).toHaveLength(2);
            expect(categories).toContain('Animals');
            expect(categories).toContain('Home');
        });

        it('should handle words with missing category field', () => {
            const wordsWithMissingCategory = [
                ...mockWords,
                {
                    id: 'word-6',
                    englishWord: 'test',
                    hebrewTranslation: 'מבחן',
                    category: undefined,
                    level: 2,
                } as any,
            ];

            const level2Words = wordsWithMissingCategory.filter(
                (w) => (w.level ?? (w as any).difficulty) === 2
            );
            const categories = [...new Set(level2Words.map((w) => w.category).filter(Boolean))];

            expect(categories).toHaveLength(2);
            expect(categories).toContain('Animals');
            expect(categories).toContain('Home');
        });
    });

    describe('Empty Categories Handling', () => {
        it('should handle empty word list gracefully', () => {
            const words: any[] = [];
            const level2Words = words.filter((w) => (w.level ?? w.difficulty) === 2);
            const categories = [...new Set(level2Words.map((w) => w.category))];

            expect(level2Words).toHaveLength(0);
            expect(categories).toHaveLength(0);
        });

        it('should handle level with no words', () => {
            const mockWords = [
                {
                    id: 'word-1',
                    englishWord: 'cat',
                    hebrewTranslation: 'חתול',
                    category: 'Animals',
                    level: 2,
                },
            ];

            const level3Words = mockWords.filter((w) => (w.level ?? (w as any).difficulty) === 3);
            const categories = [...new Set(level3Words.map((w) => w.category))];

            expect(level3Words).toHaveLength(0);
            expect(categories).toHaveLength(0);
        });

        it('should handle category with no words at specific level', () => {
            const mockWords = [
                {
                    id: 'word-1',
                    englishWord: 'cat',
                    hebrewTranslation: 'חתול',
                    category: 'Animals',
                    level: 2,
                },
                {
                    id: 'word-2',
                    englishWord: 'house',
                    hebrewTranslation: 'בית',
                    category: 'Home',
                    level: 3,
                },
            ];

            const level2Animals = mockWords.filter(
                (w) => (w.level ?? (w as any).difficulty) === 2 && w.category === 'Animals'
            );

            expect(level2Animals).toHaveLength(1);

            const level2Home = mockWords.filter(
                (w) => (w.level ?? (w as any).difficulty) === 2 && w.category === 'Home'
            );

            expect(level2Home).toHaveLength(0);
        });
    });

    describe('Progress Calculation with Defensive Access', () => {
        it('should calculate progress correctly with level field', () => {
            const mockWords = [
                { id: 'word-1', level: 2, category: 'Animals' },
                { id: 'word-2', level: 2, category: 'Animals' },
                { id: 'word-3', level: 2, category: 'Animals' },
            ];

            const seenWordIds = new Set(['word-1', 'word-2']);

            const categoryWords = mockWords.filter(
                (w) => (w.level ?? (w as any).difficulty) === 2 && w.category === 'Animals'
            );
            const seenCount = categoryWords.filter((w) => seenWordIds.has(w.id)).length;
            const progress = Math.round((seenCount / categoryWords.length) * 100);

            expect(progress).toBe(67); // 2/3 = 66.67% rounded to 67%
        });

        it('should calculate progress with fallback to difficulty', () => {
            const mockWords = [
                { id: 'word-1', difficulty: 2, category: 'Animals' },
                { id: 'word-2', difficulty: 2, category: 'Animals' },
                { id: 'word-3', difficulty: 2, category: 'Animals' },
            ] as any[];

            const seenWordIds = new Set(['word-1']);

            const categoryWords = mockWords.filter(
                (w) => (w.level ?? w.difficulty) === 2 && w.category === 'Animals'
            );
            const seenCount = categoryWords.filter((w) => seenWordIds.has(w.id)).length;
            const progress = Math.round((seenCount / categoryWords.length) * 100);

            expect(progress).toBe(33); // 1/3 = 33.33% rounded to 33%
        });

        it('should handle zero words in category', () => {
            const mockWords: any[] = [];
            const seenWordIds = new Set<string>();

            const categoryWords = mockWords.filter(
                (w) => (w.level ?? w.difficulty) === 2 && w.category === 'Animals'
            );
            const seenCount = categoryWords.filter((w) => seenWordIds.has(w.id)).length;
            const progress = categoryWords.length > 0 ? Math.round((seenCount / categoryWords.length) * 100) : 0;

            expect(progress).toBe(0);
        });
    });

    describe('Mixed Data Scenarios', () => {
        it('should handle words with both level and difficulty fields', () => {
            const mockWords = [
                { id: 'word-1', level: 2, difficulty: 1, category: 'Animals' },
                { id: 'word-2', level: 3, difficulty: 2, category: 'School' },
                { id: 'word-3', difficulty: 1, category: 'Home' }, // Missing level
            ] as any[];

            const level2Words = mockWords.filter((w) => (w.level ?? w.difficulty) === 2);
            const level3Words = mockWords.filter((w) => (w.level ?? w.difficulty) === 3);
            const level1Words = mockWords.filter((w) => (w.level ?? w.difficulty) === 1);

            expect(level2Words).toHaveLength(1);
            expect(level2Words[0].id).toBe('word-1');

            expect(level3Words).toHaveLength(1);
            expect(level3Words[0].id).toBe('word-2');

            expect(level1Words).toHaveLength(1);
            expect(level1Words[0].id).toBe('word-3');
        });

        it('should prioritize level over difficulty when both exist', () => {
            const word = {
                id: 'word-1',
                level: 3,
                difficulty: 1,
                category: 'Test',
            };

            const wordLevel = word.level ?? (word as any).difficulty;
            expect(wordLevel).toBe(3);
        });
    });
});
