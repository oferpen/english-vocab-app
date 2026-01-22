import { describe, it, expect } from 'vitest';
import { getTodayDate } from '@/lib/utils';

describe('Utils', () => {
  describe('getTodayDate', () => {
    it('should return date in YYYY-MM-DD format', () => {
      const date = getTodayDate();
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return today\'s date', () => {
      const date = getTodayDate();
      const today = new Date();
      const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      expect(date).toBe(expected);
    });
  });
});
