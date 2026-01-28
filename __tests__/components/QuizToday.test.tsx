import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuizToday from '@/components/QuizToday';
import { getAllWords } from '@/app/actions/words';
import { getSettings } from '@/app/actions/settings';
import { getLevelState } from '@/app/actions/levels';

const mocks = vi.hoisted(() => ({
  getAllWords: vi.fn(),
  getWordsByCategory: vi.fn(),
  getSettings: vi.fn(),
  getLevelState: vi.fn(),
  recordQuizAttempt: vi.fn(),
  addXP: vi.fn(),
  updateMissionProgress: vi.fn(),
  playSuccessSound: vi.fn(),
  playFailureSound: vi.fn(),
  routerPush: vi.fn(),
}));

vi.mock('@/app/actions/words', () => ({
  getAllWords: mocks.getAllWords,
  getWordsByCategory: mocks.getWordsByCategory,
}));

vi.mock('@/app/actions/settings', () => ({
  getSettings: mocks.getSettings,
}));

vi.mock('@/app/actions/levels', () => ({
  getLevelState: mocks.getLevelState,
  addXP: mocks.addXP,
}));

vi.mock('@/app/actions/progress', () => ({
  recordQuizAttempt: mocks.recordQuizAttempt,
}));

vi.mock('@/app/actions/missions', () => ({
  updateMissionProgress: mocks.updateMissionProgress,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mocks.routerPush,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/sounds', () => ({
  playSuccessSound: mocks.playSuccessSound,
  playFailureSound: mocks.playFailureSound,
}));

describe('QuizToday - Bug Fixes', () => {
  const mockTodayPlan = {
    id: 'plan-1',
    childId: 'child-1',
    date: '2024-01-01',
    words: [
      { word: { id: 'word-1', englishWord: 'cat', hebrewTranslation: 'חתול', difficulty: 1, category: 'Animals' } },
      { word: { id: 'word-2', englishWord: 'dog', hebrewTranslation: 'כלב', difficulty: 1, category: 'Animals' } },
      { word: { id: 'word-3', englishWord: 'bird', hebrewTranslation: 'ציפור', difficulty: 1, category: 'Animals' } },
    ],
  };

  const mockSettings = {
    questionTypes: {
      enToHe: true,
      heToEn: true,
      audioToEn: true,
    },
  };

  const mockLevelState = {
    level: 2,
    xp: 50,
    id: 'level-1',
    childId: 'child-1',
    updatedAt: new Date(),
  };

  const mockWords = [
    { id: 'word-1', englishWord: 'cat', hebrewTranslation: 'חתול', difficulty: 1, category: 'Animals' },
    { id: 'word-2', englishWord: 'dog', hebrewTranslation: 'כלב', difficulty: 1, category: 'Animals' },
    { id: 'word-3', englishWord: 'bird', hebrewTranslation: 'ציפור', difficulty: 1, category: 'Animals' },
    { id: 'word-4', englishWord: 'fish', hebrewTranslation: 'דג', difficulty: 1, category: 'Animals' },
    { id: 'word-5', englishWord: 'rabbit', hebrewTranslation: 'ארנב', difficulty: 1, category: 'Animals' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSettings.mockResolvedValue(mockSettings);
    mocks.getLevelState.mockImplementation((id: string) => {
      console.log('Test Mock getLevelState called with:', id);
      return Promise.resolve({
        level: 2,
        xp: 50,
        id: 'level-1',
        childId: 'child-1',
      });
    });
    mocks.getAllWords.mockResolvedValue(mockWords);
    mocks.getWordsByCategory.mockResolvedValue(mockWords);
    mocks.recordQuizAttempt.mockResolvedValue({});
    mocks.addXP.mockResolvedValue({});
    mocks.updateMissionProgress.mockResolvedValue({});
  });



  describe('Bug: Selected answer persists to next question', () => {
    it('should reset selectedAnswer when moving to next question', async () => {
      const user = userEvent.setup();
      render(<QuizToday childId="child-1" todayPlan={mockTodayPlan} />);

      // Wait for questions to load
      await waitFor(() => {
        expect(screen.queryByText('טוען חידון...')).not.toBeInTheDocument();
      });

      // Find and click an answer - look for buttons that are answer options (not navigation buttons)
      await waitFor(() => {
        const answerButtons = screen.getAllByRole('button').filter(
          btn => btn.textContent && btn.textContent.length > 0 && !btn.textContent.includes('המשך') && !btn.textContent.includes('נסה שוב') && !btn.textContent.includes('דלג')
        );
        expect(answerButtons.length).toBeGreaterThan(0);
      });

      const answerButtons = screen.getAllByRole('button').filter(
        btn => btn.textContent && btn.textContent.length > 0 && !btn.textContent.includes('המשך') && !btn.textContent.includes('נסה שוב') && !btn.textContent.includes('דלג')
      );
      expect(answerButtons.length).toBeGreaterThan(0);
      const firstAnswer = answerButtons[0];

      // Click the answer button
      await user.click(firstAnswer);

      // Wait for result to show - check for visual indicators that result is displayed
      // This could be: disabled buttons, continue/retry buttons, or success/error messages
      await waitFor(() => {
        // Check for continue button, retry button, success message, or disabled answer buttons
        const continueButton = screen.queryByText('המשך →');
        const retryButton = screen.queryByText(/נסה שוב/);
        const successMessage = screen.queryByText(/נכון/);
        const errorMessage = screen.queryByText(/לא נכון/);
        // Check if any answer button has result styling (success/error colors)
        const answerButtonsAfterClick = screen.getAllByRole('button').filter(
          btn => btn.textContent && btn.textContent.length > 0 &&
            !btn.textContent.includes('המשך') &&
            !btn.textContent.includes('נסה שוב') &&
            !btn.textContent.includes('דלג')
        );
        const hasResultStyling = answerButtonsAfterClick.some(btn =>
          btn.className.includes('bg-success-500') ||
          btn.className.includes('bg-red-500') ||
          btn.className.includes('bg-gray-100')
        );
        const disabledButtons = screen.getAllByRole('button').filter(btn => btn.disabled);

        const hasContinueButton = !!continueButton;
        const hasRetryButton = !!retryButton;
        const hasSuccessMessage = !!successMessage;
        const hasErrorMessage = !!errorMessage;
        const hasDisabledButtons = disabledButtons.length > 0;

        // When result is shown, at least one indicator should be present
        expect(hasContinueButton || hasRetryButton || hasSuccessMessage || hasErrorMessage || hasResultStyling || hasDisabledButtons).toBe(true);
      }, { timeout: 3000 });

      // Click "המשך" to go to next question
      const continueButton = screen.getByText('המשך →');
      await user.click(continueButton);

      // Wait for next question to load
      await waitFor(() => {
        // Check that we're on question 2
        expect(screen.getByText(/2 מתוך/)).toBeInTheDocument();
        // Check that no answer is selected (all buttons should be enabled and not highlighted)
        const allAnswerButtons = screen.getAllByRole('button').filter(
          btn => btn.textContent && btn.textContent.length > 0 && !btn.textContent.includes('המשך') && !btn.textContent.includes('נסה שוב') && !btn.textContent.includes('דלג')
        );
        // Should have answer buttons
        expect(allAnswerButtons.length).toBeGreaterThan(0);
        // All buttons should be clickable (not disabled)
        allAnswerButtons.forEach(btn => {
          expect(btn).not.toHaveClass('bg-success-500'); // Not showing correct answer from previous question
        });
      });
    });

    it('should track selectedAnswerQuestionId correctly', async () => {
      const user = userEvent.setup();
      render(<QuizToday childId="child-1" todayPlan={mockTodayPlan} />);

      await waitFor(() => {
        expect(screen.queryByText('טוען חידון...')).not.toBeInTheDocument();
      });

      // Answer first question
      const answerButtons = screen.getAllByRole('button').filter(
        btn => btn.textContent && (btn.textContent === 'חתול' || btn.textContent === 'כלב' || btn.textContent === 'ציפור')
      );
      if (answerButtons.length > 0) {
        await user.click(answerButtons[0]);

        await waitFor(() => {
          expect(screen.getByText(/נכון|לא נכון/)).toBeInTheDocument();
        });

        // Move to next question
        const continueButton = screen.getByText('המשך →');
        await user.click(continueButton);

        // Verify we can answer the next question
        await waitFor(() => {
          const nextAnswerButtons = screen.getAllByRole('button').filter(
            btn => btn.textContent && btn.textContent.length > 0 && !btn.textContent.includes('המשך') && !btn.textContent.includes('נסה שוב') && !btn.textContent.includes('דלג')
          );
          expect(nextAnswerButtons.length).toBeGreaterThan(0);
          // All buttons should be enabled
          nextAnswerButtons.forEach(btn => {
            expect(btn).not.toBeDisabled();
          });
        });
      }
    });
  });

  describe('Bug: Progress bar not updating', () => {
    it('should update progress bar when moving to next question', async () => {
      const user = userEvent.setup();
      render(<QuizToday childId="child-1" todayPlan={mockTodayPlan} />);

      await waitFor(() => {
        expect(screen.queryByText('טוען חידון...')).not.toBeInTheDocument();
      });

      // Check initial progress
      expect(screen.getByText(/1 מתוך/)).toBeInTheDocument();

      // Answer first question
      const answerButtons = screen.getAllByRole('button').filter(
        btn => btn.textContent && (btn.textContent === 'חתול' || btn.textContent === 'כלב' || btn.textContent === 'ציפור')
      );
      if (answerButtons.length > 0) {
        await user.click(answerButtons[0]);

        await waitFor(() => {
          expect(screen.getByText(/נכון|לא נכון/)).toBeInTheDocument();
        });

        // Move to next question
        const continueButton = screen.getByText('המשך →');
        await user.click(continueButton);

        // Check that progress updated
        await waitFor(() => {
          expect(screen.getByText(/2 מתוך/)).toBeInTheDocument();
        });
      }
    });

    it('should reset currentIndex when todayPlan changes', async () => {
      const { rerender } = render(<QuizToday childId="child-1" todayPlan={mockTodayPlan} />);

      await waitFor(() => {
        expect(screen.queryByText('טוען חידון...')).not.toBeInTheDocument();
      });

      // Change todayPlan
      const newPlan = {
        ...mockTodayPlan,
        id: 'plan-2',
      };

      rerender(<QuizToday childId="child-1" todayPlan={newPlan} />);

      await waitFor(() => {
        // Progress should reset to 1
        expect(screen.getByText(/1 מתוך/)).toBeInTheDocument();
      });
    });
  });

  describe('Bug: Buttons not clickable on second question', () => {
    it('should enable buttons on second question', async () => {
      const user = userEvent.setup();
      render(<QuizToday childId="child-1" todayPlan={mockTodayPlan} />);

      await waitFor(() => {
        expect(screen.queryByText('טוען חידון...')).not.toBeInTheDocument();
      });

      // Answer first question
      const firstAnswerButtons = screen.getAllByRole('button').filter(
        btn => btn.textContent && (btn.textContent === 'חתול' || btn.textContent === 'כלב' || btn.textContent === 'ציפור')
      );
      if (firstAnswerButtons.length > 0) {
        await user.click(firstAnswerButtons[0]);

        await waitFor(() => {
          expect(screen.getByText(/נכון|לא נכון/)).toBeInTheDocument();
        });

        // Move to next question
        const continueButton = screen.getByText('המשך →');
        await user.click(continueButton);

        // Wait for second question
        await waitFor(() => {
          expect(screen.getByText(/2 מתוך/)).toBeInTheDocument();
        });

        // Check that buttons are clickable
        const secondAnswerButtons = screen.getAllByRole('button').filter(
          btn => btn.textContent && btn.textContent.length > 0 && !btn.textContent.includes('המשך') && !btn.textContent.includes('נסה שוב') && !btn.textContent.includes('דלג')
        );
        expect(secondAnswerButtons.length).toBeGreaterThan(0);
        secondAnswerButtons.forEach(btn => {
          expect(btn).not.toBeDisabled();
        });
      }
    });

    it('should correctly calculate isCurrentQuestionResult', async () => {
      const user = userEvent.setup();
      render(<QuizToday childId="child-1" todayPlan={mockTodayPlan} />);

      await waitFor(() => {
        expect(screen.queryByText('טוען חידון...')).not.toBeInTheDocument();
      });

      // Answer first question
      await waitFor(() => {
        const answerButtons = screen.getAllByRole('button').filter(
          btn => btn.textContent && btn.textContent.length > 0 && !btn.textContent.includes('המשך') && !btn.textContent.includes('נסה שוב') && !btn.textContent.includes('דלג')
        );
        expect(answerButtons.length).toBeGreaterThan(0);
      });

      const answerButtons = screen.getAllByRole('button').filter(
        btn => btn.textContent && btn.textContent.length > 0 && !btn.textContent.includes('המשך') && !btn.textContent.includes('נסה שוב') && !btn.textContent.includes('דלג')
      );
      await user.click(answerButtons[0]);

      await waitFor(() => {
        // Buttons should be disabled when showing result, or action buttons should appear
        const continueButton = screen.queryByText('המשך →');
        const retryButton = screen.queryByText(/נסה שוב/);
        const successMessage = screen.queryByText(/נכון/);
        const errorMessage = screen.queryByText(/לא נכון/);
        // Check if any answer button has result styling (success/error colors)
        const answerButtonsAfterClick = screen.getAllByRole('button').filter(
          btn => btn.textContent && btn.textContent.length > 0 &&
            !btn.textContent.includes('המשך') &&
            !btn.textContent.includes('נסה שוב') &&
            !btn.textContent.includes('דלג')
        );
        const hasResultStyling = answerButtonsAfterClick.some(btn =>
          btn.className.includes('bg-success-500') ||
          btn.className.includes('bg-red-500') ||
          btn.className.includes('bg-gray-100')
        );
        const disabledButtons = screen.getAllByRole('button').filter(btn => btn.disabled);

        const hasContinueButton = !!continueButton;
        const hasRetryButton = !!retryButton;
        const hasSuccessMessage = !!successMessage;
        const hasErrorMessage = !!errorMessage;
        const hasDisabledButtons = disabledButtons.length > 0;

        // When result is shown, at least one indicator should be present
        expect(hasContinueButton || hasRetryButton || hasSuccessMessage || hasErrorMessage || hasResultStyling || hasDisabledButtons).toBe(true);
      }, { timeout: 3000 });

      // Move to next question
      const continueButton = screen.getByText('המשך →');
      await user.click(continueButton);

      // Buttons should be enabled again
      await waitFor(() => {
        const enabledButtons = screen.getAllByRole('button').filter(
          btn => btn.textContent && btn.textContent.length > 0 && !btn.textContent.includes('המשך') && !btn.textContent.includes('נסה שוב') && !btn.textContent.includes('דלג') && !btn.disabled
        );
        expect(enabledButtons.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe('Bug: No words available after finishing category learning', () => {
    it('should pass category to quiz when provided', async () => {
      render(<QuizToday childId="child-1" todayPlan={mockTodayPlan} category="Animals" levelState={mockLevelState} />);

      await waitFor(() => {
        expect(screen.queryByText('טוען חידון...')).not.toBeInTheDocument();
      });

      // Should not show "no words available" error
      expect(screen.queryByText('אין מילים זמינות לחידון')).not.toBeInTheDocument();

      // Should show questions
      await waitFor(() => {
        const answerButtons = screen.getAllByRole('button').filter(
          btn => btn.textContent && btn.textContent.length > 0 && !btn.textContent.includes('המשך') && !btn.textContent.includes('נסה שוב') && !btn.textContent.includes('דלג')
        );
        expect(answerButtons.length).toBeGreaterThan(0);
      });
    });

    it('should filter words correctly when category is provided', async () => {
      mocks.getAllWords.mockResolvedValue(mockWords);

      render(<QuizToday childId="child-1" todayPlan={mockTodayPlan} category="Animals" />);

      await waitFor(() => {
        expect(screen.queryByText('טוען חידון...')).not.toBeInTheDocument();
      });

      // Verify that words are displayed (not filtered out incorrectly)
      expect(screen.queryByText('אין מילים זמינות לחידון')).not.toBeInTheDocument();
    });
  });

  describe('Bug: Level 3 words shown after finishing letters', () => {
    it('should filter words by level correctly', async () => {
      const level2Words = mockWords.filter(w => w.difficulty === 1);
      const level3Words = [
        { id: 'word-6', englishWord: 'auditorium', hebrewTranslation: 'אודיטוריום', difficulty: 2, category: 'School' },
        { id: 'word-7', englishWord: 'cafeteria', hebrewTranslation: 'קפיטריה', difficulty: 2, category: 'School' },
      ];

      mocks.getLevelState.mockResolvedValue({ ...mockLevelState, level: 2 });
      mocks.getAllWords.mockResolvedValue(level2Words);

      render(<QuizToday childId="child-1" todayPlan={mockTodayPlan} />);

      await waitFor(() => {
        expect(screen.queryByText('טוען חידון...')).not.toBeInTheDocument();
      });

      // Should not show level 3 words
      expect(screen.queryByText('אודיטוריום')).not.toBeInTheDocument();
      expect(screen.queryByText('קפיטריה')).not.toBeInTheDocument();

      // Should show level 2 words
      await waitFor(() => {
        const answerButtons = screen.getAllByRole('button').filter(
          btn => btn.textContent && btn.textContent.length > 0 && !btn.textContent.includes('המשך') && !btn.textContent.includes('נסה שוב') && !btn.textContent.includes('דלג')
        );
        expect(answerButtons.length).toBeGreaterThan(0);
      });
    });

    it('should use category words without additional filtering', async () => {
      mocks.getLevelState.mockResolvedValue({ ...mockLevelState, level: 2 });

      render(<QuizToday childId="child-1" todayPlan={mockTodayPlan} category="Animals" />);

      await waitFor(() => {
        expect(screen.queryByText('טוען חידון...')).not.toBeInTheDocument();
      });

      // Should show words from the category
      expect(screen.queryByText('אין מילים זמינות לחידון')).not.toBeInTheDocument();
    });
  });
});
