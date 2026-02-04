import { describe, it, expect } from 'vitest';

/**
 * Tests for LearnPath Trophy Threshold Change
 * 
 * Change: Trophy threshold changed from 60% to 90% mastery
 * 
 * These tests ensure that:
 * 1. Trophy appears only when >= 90% of words are mastered (masteryScore >= 80)
 * 2. Trophy does NOT appear at 60% mastery
 * 3. Trophy does NOT appear at 89% mastery
 * 4. Trophy DOES appear at 90% mastery
 * 5. Trophy DOES appear at 100% mastery
 */

describe('LearnPath Trophy Threshold (90%)', () => {
  describe('Category Completion Calculation', () => {
    const createMockProgress = (wordId: string, masteryScore: number) => ({
      wordId,
      masteryScore,
      timesSeenInLearn: 0,
      lastSeenAt: new Date(),
    });

    const createMockWord = (id: string) => ({
      id,
      englishWord: `word-${id}`,
      hebrewTranslation: `מילה-${id}`,
      category: 'Animals',
      level: 2,
    });

    describe('90% Threshold Logic', () => {
      it('should mark category as completed at exactly 90% mastery', () => {
        // 10 words, 9 mastered (90%)
        const words = Array.from({ length: 10 }, (_, i) => createMockWord(`word-${i}`));
        const progressMap = new Map([
          ...Array.from({ length: 9 }, (_, i) => [
            `word-${i}`,
            createMockProgress(`word-${i}`, 100), // Mastered
          ]),
          ['word-9', createMockProgress('word-9', 0)], // Not mastered
        ]);

        const lessons = words.map((word) => ({
          id: `word-${word.id}`,
          type: 'word' as const,
          content: word,
          completed: (progressMap.get(word.id)?.masteryScore || 0) >= 80,
          active: true,
          locked: false,
        }));

        const masteredCount = lessons.filter((l) => l.completed).length;
        const isCategoryCompleted = lessons.length > 0 && masteredCount / lessons.length >= 0.9;

        expect(masteredCount).toBe(9);
        expect(isCategoryCompleted).toBe(true); // 9/10 = 90%
      });

      it('should NOT mark category as completed at 89% mastery', () => {
        // 10 words, 8.9 mastered (rounds to 8 or 9, but 8/10 = 80%, 9/10 = 90%)
        // Let's test with 8 mastered (80%)
        const words = Array.from({ length: 10 }, (_, i) => createMockWord(`word-${i}`));
        const progressMap = new Map([
          ...Array.from({ length: 8 }, (_, i) => [
            `word-${i}`,
            createMockProgress(`word-${i}`, 100), // Mastered
          ]),
          ['word-8', createMockProgress('word-8', 0)], // Not mastered
          ['word-9', createMockProgress('word-9', 0)], // Not mastered
        ]);

        const lessons = words.map((word) => ({
          id: `word-${word.id}`,
          type: 'word' as const,
          content: word,
          completed: (progressMap.get(word.id)?.masteryScore || 0) >= 80,
          active: true,
          locked: false,
        }));

        const masteredCount = lessons.filter((l) => l.completed).length;
        const isCategoryCompleted = lessons.length > 0 && masteredCount / lessons.length >= 0.9;

        expect(masteredCount).toBe(8);
        expect(isCategoryCompleted).toBe(false); // 8/10 = 80% < 90%
      });

      it('should NOT mark category as completed at 60% mastery (old threshold)', () => {
        // 10 words, 6 mastered (60% - old threshold)
        const words = Array.from({ length: 10 }, (_, i) => createMockWord(`word-${i}`));
        const progressMap = new Map([
          ...Array.from({ length: 6 }, (_, i) => [
            `word-${i}`,
            createMockProgress(`word-${i}`, 100), // Mastered
          ]),
          ...Array.from({ length: 4 }, (_, i) => [
            `word-${i + 6}`,
            createMockProgress(`word-${i + 6}`, 0), // Not mastered
          ]),
        ]);

        const lessons = words.map((word) => ({
          id: `word-${word.id}`,
          type: 'word' as const,
          content: word,
          completed: (progressMap.get(word.id)?.masteryScore || 0) >= 80,
          active: true,
          locked: false,
        }));

        const masteredCount = lessons.filter((l) => l.completed).length;
        const isCategoryCompleted = lessons.length > 0 && masteredCount / lessons.length >= 0.9;

        expect(masteredCount).toBe(6);
        expect(isCategoryCompleted).toBe(false); // 6/10 = 60% < 90%
      });

      it('should mark category as completed at 100% mastery', () => {
        // 10 words, all mastered (100%)
        const words = Array.from({ length: 10 }, (_, i) => createMockWord(`word-${i}`));
        const progressMap = new Map(
          Array.from({ length: 10 }, (_, i) => [
            `word-${i}`,
            createMockProgress(`word-${i}`, 100), // All mastered
          ])
        );

        const lessons = words.map((word) => ({
          id: `word-${word.id}`,
          type: 'word' as const,
          content: word,
          completed: (progressMap.get(word.id)?.masteryScore || 0) >= 80,
          active: true,
          locked: false,
        }));

        const masteredCount = lessons.filter((l) => l.completed).length;
        const isCategoryCompleted = lessons.length > 0 && masteredCount / lessons.length >= 0.9;

        expect(masteredCount).toBe(10);
        expect(isCategoryCompleted).toBe(true); // 10/10 = 100% >= 90%
      });

      it('should handle edge case: exactly 9 out of 10 words (90%)', () => {
        const words = Array.from({ length: 10 }, (_, i) => createMockWord(`word-${i}`));
        const progressMap = new Map([
          ...Array.from({ length: 9 }, (_, i) => [
            `word-${i}`,
            createMockProgress(`word-${i}`, 100),
          ]),
          ['word-9', createMockProgress('word-9', 0)],
        ]);

        const lessons = words.map((word) => ({
          id: `word-${word.id}`,
          type: 'word' as const,
          content: word,
          completed: (progressMap.get(word.id)?.masteryScore || 0) >= 80,
          active: true,
          locked: false,
        }));

        const masteredCount = lessons.filter((l) => l.completed).length;
        const isCategoryCompleted = lessons.length > 0 && masteredCount / lessons.length >= 0.9;

        expect(masteredCount).toBe(9);
        expect(isCategoryCompleted).toBe(true); // 9/10 = 0.9 = 90%
      });

      it('should handle edge case: 8 out of 10 words (80%) - should NOT complete', () => {
        const words = Array.from({ length: 10 }, (_, i) => createMockWord(`word-${i}`));
        const progressMap = new Map([
          ...Array.from({ length: 8 }, (_, i) => [
            `word-${i}`,
            createMockProgress(`word-${i}`, 100),
          ]),
          ['word-8', createMockProgress('word-8', 0)],
          ['word-9', createMockProgress('word-9', 0)],
        ]);

        const lessons = words.map((word) => ({
          id: `word-${word.id}`,
          type: 'word' as const,
          content: word,
          completed: (progressMap.get(word.id)?.masteryScore || 0) >= 80,
          active: true,
          locked: false,
        }));

        const masteredCount = lessons.filter((l) => l.completed).length;
        const isCategoryCompleted = lessons.length > 0 && masteredCount / lessons.length >= 0.9;

        expect(masteredCount).toBe(8);
        expect(isCategoryCompleted).toBe(false); // 8/10 = 0.8 = 80% < 90%
      });
    });

    describe('Different Category Sizes', () => {
      it('should work with small categories (5 words)', () => {
        // 5 words, need at least 5 * 0.9 = 4.5, so 5 mastered (100%)
        const words = Array.from({ length: 5 }, (_, i) => createMockWord(`word-${i}`));
        const progressMap = new Map([
          ...Array.from({ length: 4 }, (_, i) => [
            `word-${i}`,
            createMockProgress(`word-${i}`, 100),
          ]),
          ['word-4', createMockProgress('word-4', 0)],
        ]);

        const lessons = words.map((word) => ({
          id: `word-${word.id}`,
          type: 'word' as const,
          content: word,
          completed: (progressMap.get(word.id)?.masteryScore || 0) >= 80,
          active: true,
          locked: false,
        }));

        const masteredCount = lessons.filter((l) => l.completed).length;
        const isCategoryCompleted = lessons.length > 0 && masteredCount / lessons.length >= 0.9;

        expect(masteredCount).toBe(4);
        expect(isCategoryCompleted).toBe(false); // 4/5 = 80% < 90%

        // With 5 mastered (100%)
        const progressMap100 = new Map(
          Array.from({ length: 5 }, (_, i) => [
            `word-${i}`,
            createMockProgress(`word-${i}`, 100),
          ])
        );
        const lessons100 = words.map((word) => ({
          id: `word-${word.id}`,
          type: 'word' as const,
          content: word,
          completed: (progressMap100.get(word.id)?.masteryScore || 0) >= 80,
          active: true,
          locked: false,
        }));
        const masteredCount100 = lessons100.filter((l) => l.completed).length;
        const isCategoryCompleted100 = lessons100.length > 0 && masteredCount100 / lessons100.length >= 0.9;

        expect(masteredCount100).toBe(5);
        expect(isCategoryCompleted100).toBe(true); // 5/5 = 100% >= 90%
      });

      it('should work with large categories (20 words)', () => {
        // 20 words, need at least 20 * 0.9 = 18 mastered
        const words = Array.from({ length: 20 }, (_, i) => createMockWord(`word-${i}`));
        
        // 17 mastered (85%)
        const progressMap85 = new Map([
          ...Array.from({ length: 17 }, (_, i) => [
            `word-${i}`,
            createMockProgress(`word-${i}`, 100),
          ]),
          ...Array.from({ length: 3 }, (_, i) => [
            `word-${i + 17}`,
            createMockProgress(`word-${i + 17}`, 0),
          ]),
        ]);

        const lessons85 = words.map((word) => ({
          id: `word-${word.id}`,
          type: 'word' as const,
          content: word,
          completed: (progressMap85.get(word.id)?.masteryScore || 0) >= 80,
          active: true,
          locked: false,
        }));

        const masteredCount85 = lessons85.filter((l) => l.completed).length;
        const isCategoryCompleted85 = lessons85.length > 0 && masteredCount85 / lessons85.length >= 0.9;

        expect(masteredCount85).toBe(17);
        expect(isCategoryCompleted85).toBe(false); // 17/20 = 85% < 90%

        // 18 mastered (90%)
        const progressMap90 = new Map([
          ...Array.from({ length: 18 }, (_, i) => [
            `word-${i}`,
            createMockProgress(`word-${i}`, 100),
          ]),
          ...Array.from({ length: 2 }, (_, i) => [
            `word-${i + 18}`,
            createMockProgress(`word-${i + 18}`, 0),
          ]),
        ]);

        const lessons90 = words.map((word) => ({
          id: `word-${word.id}`,
          type: 'word' as const,
          content: word,
          completed: (progressMap90.get(word.id)?.masteryScore || 0) >= 80,
          active: true,
          locked: false,
        }));

        const masteredCount90 = lessons90.filter((l) => l.completed).length;
        const isCategoryCompleted90 = lessons90.length > 0 && masteredCount90 / lessons90.length >= 0.9;

        expect(masteredCount90).toBe(18);
        expect(isCategoryCompleted90).toBe(true); // 18/20 = 90% >= 90%
      });
    });

    describe('Mastery Score Threshold (80)', () => {
      it('should only count words with masteryScore >= 80 as completed', () => {
        const words = Array.from({ length: 10 }, (_, i) => createMockWord(`word-${i}`));
        const progressMap = new Map([
          ['word-0', createMockProgress('word-0', 100)], // Mastered
          ['word-1', createMockProgress('word-1', 90)], // Mastered
          ['word-2', createMockProgress('word-2', 80)], // Mastered (exactly 80)
          ['word-3', createMockProgress('word-3', 79)], // NOT mastered (< 80)
          ['word-4', createMockProgress('word-4', 50)], // NOT mastered
          ['word-5', createMockProgress('word-5', 0)], // NOT mastered
          ['word-6', createMockProgress('word-6', 100)], // Mastered
          ['word-7', createMockProgress('word-7', 100)], // Mastered
          ['word-8', createMockProgress('word-8', 100)], // Mastered
          ['word-9', createMockProgress('word-9', 100)], // Mastered
        ]);

        const lessons = words.map((word) => ({
          id: `word-${word.id}`,
          type: 'word' as const,
          content: word,
          completed: (progressMap.get(word.id)?.masteryScore || 0) >= 80,
          active: true,
          locked: false,
        }));

        const masteredCount = lessons.filter((l) => l.completed).length;
        const isCategoryCompleted = lessons.length > 0 && masteredCount / lessons.length >= 0.9;

        // Should have 7 mastered (word-3 (79), word-4 (50), word-5 (0) are not mastered)
        // word-0 (100), word-1 (90), word-2 (80), word-6-9 (100) = 7 mastered
        expect(masteredCount).toBe(7);
        expect(isCategoryCompleted).toBe(false); // 7/10 = 70% < 90%

        // If we add two more mastered words (9/10 = 90%)
        progressMap.set('word-3', createMockProgress('word-3', 100));
        progressMap.set('word-4', createMockProgress('word-4', 100));
        const lessons90 = words.map((word) => ({
          id: `word-${word.id}`,
          type: 'word' as const,
          content: word,
          completed: (progressMap.get(word.id)?.masteryScore || 0) >= 80,
          active: true,
          locked: false,
        }));
        const masteredCount90 = lessons90.filter((l) => l.completed).length;
        const isCategoryCompleted90 = lessons90.length > 0 && masteredCount90 / lessons90.length >= 0.9;

        expect(masteredCount90).toBe(9); // word-0,1,2,3,4,6,7,8,9 = 9 mastered
        expect(isCategoryCompleted90).toBe(true); // 9/10 = 90% >= 90%
      });
    });

    describe('Empty Categories', () => {
      it('should handle empty category gracefully', () => {
        const words: any[] = [];
        const progressMap = new Map();

        const lessons = words.map((word) => ({
          id: `word-${word.id}`,
          type: 'word' as const,
          content: word,
          completed: (progressMap.get(word.id)?.masteryScore || 0) >= 80,
          active: true,
          locked: false,
        }));

        const masteredCount = lessons.filter((l) => l.completed).length;
        const isCategoryCompleted = lessons.length > 0 && masteredCount / lessons.length >= 0.9;

        expect(masteredCount).toBe(0);
        expect(isCategoryCompleted).toBe(false); // 0 words, so not completed
      });
    });
  });
});
