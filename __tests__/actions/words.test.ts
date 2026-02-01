import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllWords, getWord, createWord, updateWord, deleteWord } from '@/app/actions/words';
import { prisma } from '@/lib/prisma';

vi.mock('react', () => ({
  cache: (fn: any) => fn,
}));

vi.mock('@/lib/prisma', () => import('@/__mocks__/prisma'));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Words Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllWords', () => {
    it('should return all active words', async () => {
      const mockWords = [
        { id: 'word-1', englishWord: 'house', hebrewTranslation: 'בית', category: 'Home', difficulty: 1 },
        { id: 'word-2', englishWord: 'cat', hebrewTranslation: 'חתול', category: 'Animals', difficulty: 1 },
      ];

      (prisma.word.findMany as any).mockResolvedValue(mockWords);

      const words = await getAllWords();
      expect(words).toEqual(mockWords);
    });

    it('should filter by level 2 (basic words)', async () => {
      (prisma.word.findMany as any).mockResolvedValue([]);

      await getAllWords(2);
      expect(prisma.word.findMany).toHaveBeenCalledWith({
        where: { active: true, level: 2 },
        orderBy: [{ category: 'asc' }, { englishWord: 'asc' }],
      });
    });

    it('should filter by level 3 (advanced words)', async () => {
      (prisma.word.findMany as any).mockResolvedValue([]);

      await getAllWords(3);
      expect(prisma.word.findMany).toHaveBeenCalledWith({
        where: { active: true, level: 3 },
        orderBy: [{ category: 'asc' }, { englishWord: 'asc' }],
      });
    });
  });

  describe('createWord', () => {
    it('should create a new word', async () => {
      const wordData = {
        englishWord: 'dog',
        hebrewTranslation: 'כלב',
        category: 'Animals',
        difficulty: 1,
      };

      (prisma.word.create as any).mockResolvedValue({
        id: 'word-new',
        ...wordData,
        active: true,
      });

      const word = await createWord(wordData);
      expect(word).toBeDefined();
      expect(prisma.word.create).toHaveBeenCalled();
    });
  });

  describe('updateWord', () => {
    it('should update word', async () => {
      (prisma.word.update as any).mockResolvedValue({
        id: 'word-1',
        englishWord: 'updated',
      });

      await updateWord('word-1', { englishWord: 'updated' });
      expect(prisma.word.update).toHaveBeenCalledWith({
        where: { id: 'word-1' },
        data: { englishWord: 'updated' },
      });
    });
  });

  describe('deleteWord', () => {
    it('should delete word', async () => {
      (prisma.word.delete as any).mockResolvedValue({});

      await deleteWord('word-1');
      expect(prisma.word.delete).toHaveBeenCalledWith({
        where: { id: 'word-1' },
      });
    });
  });
});
