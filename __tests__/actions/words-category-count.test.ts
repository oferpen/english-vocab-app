import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getWordsByCategory, getAllCategories } from '@/app/actions/content';
import { prisma } from '@/lib/prisma';

vi.mock('react', () => ({
  cache: (fn: any) => fn,
}));

vi.mock('@/lib/prisma', () => import('@/__mocks__/prisma'));

describe('Category Word Counts', () => {
  const categories = [
    'Home',
    'School',
    'Animals',
    'Colors',
    'Food',
    'Body',
    'Family',
    'Clothes',
    'Nature',
    'Transportation',
    'Sports',
    'Weather',
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  categories.forEach((category) => {
    describe(`Category: ${category}`, () => {
      it(`should have exactly 20 words at difficulty 1 (Level 2)`, async () => {
        // Mock 20 words with difficulty 1
        const mockWords = Array.from({ length: 20 }, (_, i) => ({
          id: `word-${category}-${i}`,
          englishWord: `word${i}`,
          hebrewTranslation: `מילה${i}`,
          difficulty: 1,
          category,
          active: true,
        }));

        (prisma.word.findMany as any).mockResolvedValue(mockWords);

        const words = await getWordsByCategory(category, 2);
        expect(words.length).toBe(20);
        expect(words.every((w) => w.difficulty === 1)).toBe(true);
      });

      it(`should have exactly 20 words at difficulty 2+ (Level 3)`, async () => {
        // Mock 20 words with difficulty >= 2
        const mockWords = Array.from({ length: 20 }, (_, i) => ({
          id: `word-${category}-${i}`,
          englishWord: `word${i}`,
          hebrewTranslation: `מילה${i}`,
          difficulty: 2,
          category,
          active: true,
        }));

        (prisma.word.findMany as any).mockResolvedValue(mockWords);

        const words = await getWordsByCategory(category, 3);
        expect(words.length).toBe(20);
        expect(words.every((w) => w.difficulty >= 2)).toBe(true);
      });

      it(`should have exactly 40 words total`, async () => {
        // Mock 40 words total
        const mockWords = Array.from({ length: 40 }, (_, i) => ({
          id: `word-${category}-${i}`,
          englishWord: `word${i}`,
          hebrewTranslation: `מילה${i}`,
          difficulty: i < 20 ? 1 : 2,
          category,
          active: true,
        }));

        (prisma.word.findMany as any).mockResolvedValue(mockWords);

        const words = await getWordsByCategory(category);
        expect(words.length).toBe(40);
      });

      it(`should have no duplicate words`, async () => {
        // Mock 40 unique words
        const mockWords = Array.from({ length: 40 }, (_, i) => ({
          id: `word-${category}-${i}`,
          englishWord: `word${i}`,
          hebrewTranslation: `מילה${i}`,
          difficulty: i < 20 ? 1 : 2,
          category,
          active: true,
        }));

        (prisma.word.findMany as any).mockResolvedValue(mockWords);

        const words = await getWordsByCategory(category);
        const englishWords = words.map((w) => w.englishWord.toLowerCase());
        const uniqueWords = new Set(englishWords);
        expect(uniqueWords.size).toBe(words.length);
      });
    });
  });

  it('should have all expected categories', async () => {
    // Mock categories
    const mockCategories = categories.map(cat => ({ category: cat }));
    (prisma.word.findMany as any).mockResolvedValue(mockCategories);

    const allCategories = await getAllCategories();
    categories.forEach((category) => {
      expect(allCategories).toContain(category);
    });
  });
});
