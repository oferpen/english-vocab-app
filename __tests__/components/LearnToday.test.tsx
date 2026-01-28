import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LearnToday from '@/components/LearnToday';
import { markWordSeen } from '@/app/actions/progress';
import { addXP } from '@/app/actions/levels';
import { updateMissionProgress } from '@/app/actions/missions';

const mockMarkWordSeen = vi.fn();
const mockAddXP = vi.fn();
const mockUpdateMissionProgress = vi.fn();
const mockRouterPush = vi.fn();
const mockRouterReplace = vi.fn();

vi.mock('@/app/actions/progress', () => ({
  markWordSeen: (...args: any[]) => mockMarkWordSeen(...args),
}));

vi.mock('@/app/actions/levels', () => ({
  addXP: (...args: any[]) => mockAddXP(...args),
}));

vi.mock('@/app/actions/missions', () => ({
  updateMissionProgress: (...args: any[]) => mockUpdateMissionProgress(...args),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: mockRouterReplace,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/sounds', () => ({
  playSuccessSound: vi.fn(),
}));

describe('LearnToday - Bug Fixes', () => {
  const mockTodayPlan = {
    id: 'category-Colors-level-2',
    childId: 'child-1',
    date: '2024-01-01',
    words: [
      { word: { id: 'word-1', englishWord: 'red', hebrewTranslation: 'אדום', difficulty: 1, category: 'Colors' } },
      { word: { id: 'word-2', englishWord: 'blue', hebrewTranslation: 'כחול', difficulty: 1, category: 'Colors' } },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMarkWordSeen.mockResolvedValue({});
    mockAddXP.mockResolvedValue({});
    mockUpdateMissionProgress.mockResolvedValue({});
  });

  describe('Bug: Category not passed to quiz after finishing learning', () => {
    it('should navigate to quiz with category when finishing category learning', async () => {
      const user = userEvent.setup();
      render(<LearnToday childId="child-1" todayPlan={mockTodayPlan} category="Colors" level={2} />);

      await waitFor(() => {
        expect(screen.queryByText('טוען מילים...')).not.toBeInTheDocument();
      });

      // Mark first word as learned (Click Next)
      await waitFor(() => {
        const nextButton = screen.getByText('הבא');
        expect(nextButton).toBeInTheDocument();
      });

      const nextButton = screen.getByText('הבא');
      await user.click(nextButton);

      await waitFor(() => {
        expect(mockMarkWordSeen).toHaveBeenCalled();
      });

      // Mark second word as learned (completing the category)
      await waitFor(() => {
        const nextButton2 = screen.getByText('הבא');
        expect(nextButton2).toBeInTheDocument();
      });

      const nextButton2 = screen.getByText('הבא');
      await user.click(nextButton2);

      // Wait for celebration screen
      await waitFor(() => {
        expect(screen.getByText(/כל הכבוד/)).toBeInTheDocument();
      });

      // Click continue to quiz
      const continueButton = screen.getByText('המשך לחידון ←');
      await user.click(continueButton);

      // Verify navigation includes category
      await waitFor(() => {
        expect(mockRouterReplace).toHaveBeenCalled();
        const calls = mockRouterReplace.mock.calls;
        const lastCall = calls[calls.length - 1][0];
        expect(lastCall).toContain('category=Colors');
        expect(lastCall).toContain('level=2');
      });
    });

    it('should extract category from plan ID if not provided as prop', async () => {
      const user = userEvent.setup();
      const planWithCategoryId = {
        ...mockTodayPlan,
        id: 'category-Animals-level-2',
      };

      render(<LearnToday childId="child-1" todayPlan={planWithCategoryId} />);

      await waitFor(() => {
        expect(screen.queryByText('טוען מילים...')).not.toBeInTheDocument();
      });

      // Complete learning
      await waitFor(() => {
        const nextButton = screen.getByText('הבא');
        expect(nextButton).toBeInTheDocument();
      });

      const nextButton = screen.getByText('הבא');
      await user.click(nextButton);

      await waitFor(() => {
        const nextButton2 = screen.getByText('הבא');
        expect(nextButton2).toBeInTheDocument();
      });

      const nextButton2 = screen.getByText('הבא');
      await user.click(nextButton2);

      await waitFor(() => {
        expect(screen.getByText(/כל הכבוד/)).toBeInTheDocument();
      });

      const continueButton = screen.getByText('המשך לחידון ←');
      await user.click(continueButton);

      // Should extract category from plan ID
      await waitFor(() => {
        expect(mockRouterReplace).toHaveBeenCalled();
        const calls = mockRouterReplace.mock.calls;
        const lastCall = calls[calls.length - 1][0];
        expect(lastCall).toContain('category=Animals');
      });
    });
  });
});
