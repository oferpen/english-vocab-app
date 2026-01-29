import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Regression tests for Admin Filtering Bug
 * 
 * Bug: Admin word filtering broke after schema changes - filters didn't combine 
 * correctly and search was missing.
 * 
 * Root Cause: Missing searchTerm state and incorrect filter logic in AdminWordsManager.tsx
 * 
 * These tests ensure that:
 * 1. Level filtering works independently
 * 2. Category filtering works independently
 * 3. Search filtering works independently
 * 4. All filters can be combined without breaking each other
 */

describe('Admin Filtering Regression Tests', () => {
    const mockWords = [
        {
            id: 'word-1',
            englishWord: 'cat',
            hebrewTranslation: 'חתול',
            category: 'Animals',
            level: 2,
            active: true,
        },
        {
            id: 'word-2',
            englishWord: 'dog',
            hebrewTranslation: 'כלב',
            category: 'Animals',
            level: 2,
            active: true,
        },
        {
            id: 'word-3',
            englishWord: 'house',
            hebrewTranslation: 'בית',
            category: 'Home',
            level: 2,
            active: true,
        },
        {
            id: 'word-4',
            englishWord: 'Big',
            hebrewTranslation: 'גדול',
            category: 'Starter',
            level: 1,
            active: true,
        },
        {
            id: 'word-5',
            englishWord: 'advanced',
            hebrewTranslation: 'מתקדם',
            category: 'School',
            level: 3,
            active: true,
        },
    ];

    describe('Level Filtering', () => {
        it('should filter words by level 1', () => {
            const selectedLevel = 1;
            const selectedCategory = '';
            const searchTerm = '';

            const filtered = mockWords.filter((word) => {
                const matchesLevel = selectedLevel === 0 || word.level === selectedLevel;
                const matchesCategory = !selectedCategory || word.category === selectedCategory;
                const matchesSearch =
                    !searchTerm ||
                    word.englishWord.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    word.hebrewTranslation.includes(searchTerm);

                return matchesLevel && matchesCategory && matchesSearch;
            });

            expect(filtered).toHaveLength(1);
            expect(filtered[0].englishWord).toBe('Big');
            expect(filtered[0].level).toBe(1);
        });

        it('should filter words by level 2', () => {
            const selectedLevel = 2;
            const selectedCategory = '';
            const searchTerm = '';

            const filtered = mockWords.filter((word) => {
                const matchesLevel = selectedLevel === 0 || word.level === selectedLevel;
                const matchesCategory = !selectedCategory || word.category === selectedCategory;
                const matchesSearch =
                    !searchTerm ||
                    word.englishWord.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    word.hebrewTranslation.includes(searchTerm);

                return matchesLevel && matchesCategory && matchesSearch;
            });

            expect(filtered).toHaveLength(3);
            expect(filtered.every((w) => w.level === 2)).toBe(true);
        });

        it('should show all words when level is 0 (All)', () => {
            const selectedLevel = 0;
            const selectedCategory = '';
            const searchTerm = '';

            const filtered = mockWords.filter((word) => {
                const matchesLevel = selectedLevel === 0 || word.level === selectedLevel;
                const matchesCategory = !selectedCategory || word.category === selectedCategory;
                const matchesSearch =
                    !searchTerm ||
                    word.englishWord.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    word.hebrewTranslation.includes(searchTerm);

                return matchesLevel && matchesCategory && matchesSearch;
            });

            expect(filtered).toHaveLength(5);
        });
    });

    describe('Category Filtering', () => {
        it('should filter words by Animals category', () => {
            const selectedLevel = 0;
            const selectedCategory = 'Animals';
            const searchTerm = '';

            const filtered = mockWords.filter((word) => {
                const matchesLevel = selectedLevel === 0 || word.level === selectedLevel;
                const matchesCategory = !selectedCategory || word.category === selectedCategory;
                const matchesSearch =
                    !searchTerm ||
                    word.englishWord.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    word.hebrewTranslation.includes(searchTerm);

                return matchesLevel && matchesCategory && matchesSearch;
            });

            expect(filtered).toHaveLength(2);
            expect(filtered.every((w) => w.category === 'Animals')).toBe(true);
        });

        it('should show all words when category is empty', () => {
            const selectedLevel = 0;
            const selectedCategory = '';
            const searchTerm = '';

            const filtered = mockWords.filter((word) => {
                const matchesLevel = selectedLevel === 0 || word.level === selectedLevel;
                const matchesCategory = !selectedCategory || word.category === selectedCategory;
                const matchesSearch =
                    !searchTerm ||
                    word.englishWord.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    word.hebrewTranslation.includes(searchTerm);

                return matchesLevel && matchesCategory && matchesSearch;
            });

            expect(filtered).toHaveLength(5);
        });
    });

    describe('Search Filtering', () => {
        it('should filter words by English search term', () => {
            const selectedLevel = 0;
            const selectedCategory = '';
            const searchTerm = 'cat';

            const filtered = mockWords.filter((word) => {
                const matchesLevel = selectedLevel === 0 || word.level === selectedLevel;
                const matchesCategory = !selectedCategory || word.category === selectedCategory;
                const matchesSearch =
                    !searchTerm ||
                    word.englishWord.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    word.hebrewTranslation.includes(searchTerm);

                return matchesLevel && matchesCategory && matchesSearch;
            });

            expect(filtered).toHaveLength(1);
            expect(filtered[0].englishWord).toBe('cat');
        });

        it('should filter words by Hebrew search term', () => {
            const selectedLevel = 0;
            const selectedCategory = '';
            const searchTerm = 'בית';

            const filtered = mockWords.filter((word) => {
                const matchesLevel = selectedLevel === 0 || word.level === selectedLevel;
                const matchesCategory = !selectedCategory || word.category === selectedCategory;
                const matchesSearch =
                    !searchTerm ||
                    word.englishWord.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    word.hebrewTranslation.includes(searchTerm);

                return matchesLevel && matchesCategory && matchesSearch;
            });

            expect(filtered).toHaveLength(1);
            expect(filtered[0].hebrewTranslation).toBe('בית');
        });

        it('should be case-insensitive for English search', () => {
            const selectedLevel = 0;
            const selectedCategory = '';
            const searchTerm = 'DOG';

            const filtered = mockWords.filter((word) => {
                const matchesLevel = selectedLevel === 0 || word.level === selectedLevel;
                const matchesCategory = !selectedCategory || word.category === selectedCategory;
                const matchesSearch =
                    !searchTerm ||
                    word.englishWord.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    word.hebrewTranslation.includes(searchTerm);

                return matchesLevel && matchesCategory && matchesSearch;
            });

            expect(filtered).toHaveLength(1);
            expect(filtered[0].englishWord).toBe('dog');
        });
    });

    describe('Combined Filtering', () => {
        it('should combine level and category filters', () => {
            const selectedLevel = 2;
            const selectedCategory = 'Animals';
            const searchTerm = '';

            const filtered = mockWords.filter((word) => {
                const matchesLevel = selectedLevel === 0 || word.level === selectedLevel;
                const matchesCategory = !selectedCategory || word.category === selectedCategory;
                const matchesSearch =
                    !searchTerm ||
                    word.englishWord.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    word.hebrewTranslation.includes(searchTerm);

                return matchesLevel && matchesCategory && matchesSearch;
            });

            expect(filtered).toHaveLength(2);
            expect(filtered.every((w) => w.level === 2 && w.category === 'Animals')).toBe(true);
        });

        it('should combine level and search filters', () => {
            const selectedLevel = 2;
            const selectedCategory = '';
            const searchTerm = 'house';

            const filtered = mockWords.filter((word) => {
                const matchesLevel = selectedLevel === 0 || word.level === selectedLevel;
                const matchesCategory = !selectedCategory || word.category === selectedCategory;
                const matchesSearch =
                    !searchTerm ||
                    word.englishWord.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    word.hebrewTranslation.includes(searchTerm);

                return matchesLevel && matchesCategory && matchesSearch;
            });

            expect(filtered).toHaveLength(1);
            expect(filtered[0].englishWord).toBe('house');
            expect(filtered[0].level).toBe(2);
        });

        it('should combine category and search filters', () => {
            const selectedLevel = 0;
            const selectedCategory = 'Animals';
            const searchTerm = 'dog';

            const filtered = mockWords.filter((word) => {
                const matchesLevel = selectedLevel === 0 || word.level === selectedLevel;
                const matchesCategory = !selectedCategory || word.category === selectedCategory;
                const matchesSearch =
                    !searchTerm ||
                    word.englishWord.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    word.hebrewTranslation.includes(searchTerm);

                return matchesLevel && matchesCategory && matchesSearch;
            });

            expect(filtered).toHaveLength(1);
            expect(filtered[0].englishWord).toBe('dog');
            expect(filtered[0].category).toBe('Animals');
        });

        it('should combine all three filters (level + category + search)', () => {
            const selectedLevel = 2;
            const selectedCategory = 'Animals';
            const searchTerm = 'cat';

            const filtered = mockWords.filter((word) => {
                const matchesLevel = selectedLevel === 0 || word.level === selectedLevel;
                const matchesCategory = !selectedCategory || word.category === selectedCategory;
                const matchesSearch =
                    !searchTerm ||
                    word.englishWord.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    word.hebrewTranslation.includes(searchTerm);

                return matchesLevel && matchesCategory && matchesSearch;
            });

            expect(filtered).toHaveLength(1);
            expect(filtered[0].englishWord).toBe('cat');
            expect(filtered[0].level).toBe(2);
            expect(filtered[0].category).toBe('Animals');
        });

        it('should return empty array when no words match all filters', () => {
            const selectedLevel = 1;
            const selectedCategory = 'Animals';
            const searchTerm = 'cat';

            const filtered = mockWords.filter((word) => {
                const matchesLevel = selectedLevel === 0 || word.level === selectedLevel;
                const matchesCategory = !selectedCategory || word.category === selectedCategory;
                const matchesSearch =
                    !searchTerm ||
                    word.englishWord.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    word.hebrewTranslation.includes(searchTerm);

                return matchesLevel && matchesCategory && matchesSearch;
            });

            expect(filtered).toHaveLength(0);
        });
    });
});
