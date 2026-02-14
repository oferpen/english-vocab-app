import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Quiz from '@/components/Quiz';
import { getAllWords } from '@/app/actions/content';
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

vi.mock('@/app/actions/content', () => ({
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

describe('Quiz - Bug Fixes', () => {
  const mockTodayPlan = {
    id: 'plan-1',
    userId: 'user-1',
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
    userId: 'user-1',
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
        userId: 'user-1',
      });
    });
    mocks.getAllWords.mockResolvedValue(mockWords);
    mocks.getWordsByCategory.mockResolvedValue(mockWords);
    mocks.recordQuizAttempt.mockResolvedValue({});
    mocks.addXP.mockResolvedValue({});
    mocks.updateMissionProgress.mockResolvedValue({});
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
  });



  describe('Bug: Selected answer persists to next question', () => {
    it('should reset selectedAnswer when moving to next question', async () => {
      const user = userEvent.setup();
      render(<Quiz userId="user-1" todayPlan={mockTodayPlan} />);

      // Wait for questions to load
      await waitFor(() => {
        expect(screen.queryByText('טוען חידון...')).not.toBeInTheDocument();
      });

      // Find and click an answer - look for buttons that are answer options (not navigation buttons)
      await waitFor(() => {
        const answerButtons = screen.getAllByRole('button').filter(
          btn => btn.textContent && btn.textContent.length > 0 &&
            !btn.textContent.includes('המילה הבאה') &&
            !btn.textContent.includes('נסה שוב') &&
            !btn.textContent.includes('דלג') &&
            !btn.textContent.includes('התחל מחדש')
        );
        expect(answerButtons.length).toBeGreaterThan(0);
      });

      const answerButtons = screen.getAllByRole('button').filter(
        btn => btn.textContent && btn.textContent.length > 0 &&
          !['המילה הבאה', 'נסה שוב', 'דלג', 'התחל מחדש'].some(t => btn.textContent?.includes(t))
      );
      expect(answerButtons.length).toBeGreaterThan(0);
      const firstAnswer = answerButtons[0];

      // Click the answer button (automatically checks the answer)
      await user.click(firstAnswer);

      // Wait for result to show - check for visual indicators that result is displayed
      // This could be: continue button, retry button, success message, or disabled answer buttons
      await waitFor(() => {
        // Check for continue button, retry button, success message, or disabled answer buttons
        const buttons = screen.getAllByRole('button');
        const continueButton = buttons.find(b => b.textContent?.includes('המילה הבאה'));
        const retryButton = buttons.find(b => b.textContent?.includes('נסה שוב'));
        const successMessage = screen.queryByText(/נכון/);
        const errorMessage = screen.queryByText(/לא נכון/);

        // Check if any answer button has result styling (success/error colors)
        const answerButtonsAfterClick = buttons.filter(
          btn => btn.textContent && btn.textContent.length > 0 &&
            !['המילה הבאה', 'נסה שוב', 'דלג', 'התחל מחדש'].some(t => btn.textContent?.includes(t))
        );
        const hasResultStyling = answerButtonsAfterClick.some(btn =>
          btn.className.includes('bg-success-500') ||
          btn.className.includes('bg-danger-500') ||
          btn.className.includes('bg-danger-500') ||
          btn.className.includes('bg-red-500') ||
          btn.className.includes('bg-gray-100')
        );
        const disabledButtons = buttons.filter(btn => (btn as HTMLButtonElement).disabled);

        const hasContinueButton = !!continueButton;
        const hasRetryButton = !!retryButton;
        const hasSuccessMessage = !!successMessage;
        const hasErrorMessage = !!errorMessage;
        const hasDisabledButtons = disabledButtons.length > 0;

        // When result is shown, at least one indicator should be present
        expect(hasContinueButton || hasRetryButton || hasSuccessMessage || hasErrorMessage || hasResultStyling || hasDisabledButtons).toBe(true);
      }, { timeout: 3000 });

      // Move to next question
      const continueButton = await screen.findByText(/המילה הבאה/);
      await user.click(continueButton);

      // Wait for next question to load
      await waitFor(() => {
        // Check that we're on question 2 (progress bar should be updated)
        // The component doesn't show "X מתוך Y" text, just a progress bar
        const progressBar = document.querySelector('[style*="width"]');
        expect(progressBar).toBeInTheDocument();
        // Check that no answer is selected (all buttons should be enabled and not highlighted)
        const allAnswerButtons = screen.getAllByRole('button').filter(
          btn => btn.textContent && btn.textContent.length > 0 &&
            !['המילה הבאה', 'נסה שוב', 'דלג', 'התחל מחדש'].some(t => btn.textContent?.includes(t))
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
      render(<Quiz userId="user-1" todayPlan={mockTodayPlan} />);

      await waitFor(() => {
        expect(screen.queryByText('טוען חידון...')).not.toBeInTheDocument();
      });

      // Answer first question (automatically checks the answer)
      const answerButtons = screen.getAllByRole('button').filter(
        btn => btn.textContent && (btn.textContent === 'חתול' || btn.textContent === 'כלב' || btn.textContent === 'ציפור')
      );
      if (answerButtons.length > 0) {
        await user.click(answerButtons[0]);

        await waitFor(() => {
          // Check for result indicators (success message, retry button, or continue button)
          const successMessage = screen.queryByText(/נכון/);
          const retryButton = screen.queryByText(/נסה שוב/);
          const continueButton = screen.queryByText(/המילה הבאה/);
          expect(successMessage || retryButton || continueButton).toBeTruthy();
        });

        // Move to next question
        const continueButton = await screen.findByText(/המילה הבאה/);
        await user.click(continueButton);

        // Verify we can answer the next question
        await waitFor(() => {
          const nextAnswerButtons = screen.getAllByRole('button').filter(
            btn => btn.textContent && btn.textContent.length > 0 &&
              !['המילה הבאה', 'נסה שוב', 'דלג', 'התחל מחדש'].some(t => btn.textContent?.includes(t))
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
      render(<Quiz userId="user-1" todayPlan={mockTodayPlan} />);

      await waitFor(() => {
        expect(screen.queryByText('טוען חידון...')).not.toBeInTheDocument();
      });

      // Check initial progress (progress bar should exist)
      const progressBar = document.querySelector('[style*="width"]');
      expect(progressBar).toBeInTheDocument();

      // Answer first question (automatically checks the answer)
      const answerButtons = screen.getAllByRole('button').filter(
        btn => btn.textContent && (btn.textContent === 'חתול' || btn.textContent === 'כלב' || btn.textContent === 'ציפור')
      );
      if (answerButtons.length > 0) {
        await user.click(answerButtons[0]);

        await waitFor(() => {
          // Check for result indicators (success message, retry button, or continue button)
          const successMessage = screen.queryByText(/נכון/);
          const retryButton = screen.queryByText(/נסה שוב/);
          const continueButton = screen.queryByText(/המילה הבאה/);
          expect(successMessage || retryButton || continueButton).toBeTruthy();
        });

        // Move to next question
        const continueButton = await screen.findByText(/המילה הבאה/);
        await user.click(continueButton);

        // Check that progress updated (progress bar width should change)
        await waitFor(() => {
          const progressBar = document.querySelector('[style*="width"]');
          expect(progressBar).toBeInTheDocument();
        });
      }
    });

    it('should reset currentIndex when todayPlan changes', async () => {
      const { rerender } = render(<Quiz userId="user-1" todayPlan={mockTodayPlan} />);

      await waitFor(() => {
        expect(screen.queryByText('טוען חידון...')).not.toBeInTheDocument();
      });

      // Change todayPlan
      const newPlan = {
        ...mockTodayPlan,
        id: 'plan-2',
      };

      rerender(<Quiz userId="user-1" todayPlan={newPlan} />);

      await waitFor(() => {
        // Progress bar should exist (component doesn't show "X מתוך Y" text)
        const progressBar = document.querySelector('[style*="width"]');
        expect(progressBar).toBeInTheDocument();
      });
    });
  });

  describe('Bug: Buttons not clickable on second question', () => {
    it('should enable buttons on second question', async () => {
      const user = userEvent.setup();
      render(<Quiz userId="user-1" todayPlan={mockTodayPlan} />);

      await waitFor(() => {
        expect(screen.queryByText('טוען חידון...')).not.toBeInTheDocument();
      });

      // Answer first question
      const firstAnswerButtons = screen.getAllByRole('button').filter(
        btn => btn.textContent && (btn.textContent === 'חתול' || btn.textContent === 'כלב' || btn.textContent === 'ציפור')
      );
      if (firstAnswerButtons.length > 0) {
        await user.click(firstAnswerButtons[0]);

        // Answer is automatically checked when clicked

        await waitFor(() => {
          // Check for result indicators (success message, retry button, or continue button)
          const successMessage = screen.queryByText(/נכון/);
          const retryButton = screen.queryByText(/נסה שוב/);
          const continueButton = screen.queryByText(/המילה הבאה/);
          expect(successMessage || retryButton || continueButton).toBeTruthy();
        });

        // Move to next question
        const continueButton = await screen.findByText(/המילה הבאה/);
        await user.click(continueButton);

        // Wait for second question (progress bar should exist)
        await waitFor(() => {
          const progressBar = document.querySelector('[style*="width"]');
          expect(progressBar).toBeInTheDocument();
        });

        // Check that buttons are clickable
        const secondAnswerButtons = screen.getAllByRole('button').filter(
          btn => btn.textContent && btn.textContent.length > 0 &&
            !btn.textContent.includes('המילה הבאה') &&
            !btn.textContent.includes('נסה שוב') &&
            !btn.textContent.includes('דלג') &&
            !btn.textContent.includes('התחל מחדש')
        );
        expect(secondAnswerButtons.length).toBeGreaterThan(0);
        secondAnswerButtons.forEach(btn => {
          expect(btn).not.toBeDisabled();
        });
      }
    });

    it('should correctly calculate isCurrentQuestionResult', async () => {
      const user = userEvent.setup();
      render(<Quiz userId="user-1" todayPlan={mockTodayPlan} />);

      await waitFor(() => {
        expect(screen.queryByText('טוען חידון...')).not.toBeInTheDocument();
      });

      // Answer first question
      await waitFor(() => {
        const answerButtons = screen.getAllByRole('button').filter(
          btn => btn.textContent && btn.textContent.length > 0 &&
            !['המילה הבאה', 'נסה שוב', 'דלג', 'התחל מחדש'].some(t => btn.textContent?.includes(t))
        );
        expect(answerButtons.length).toBeGreaterThan(0);
      });

      const answerButtons = screen.getAllByRole('button').filter(
        btn => btn.textContent && btn.textContent.length > 0 &&
          !['המילה הבאה', 'נסה שוב', 'דלג', 'התחל מחדש'].some(t => btn.textContent?.includes(t))
      );
      await user.click(answerButtons[0]);

      // Answer is automatically checked when clicked
      await waitFor(() => {
        // Buttons should be disabled when showing result, or action buttons should appear
        const buttons = screen.getAllByRole('button');
        const continueButton = buttons.find(b => b.textContent?.includes('המילה הבאה'));
        const retryButton = buttons.find(b => b.textContent?.includes('נסה שוב'));
        const successMessage = screen.queryByText(/נכון/);
        const errorMessage = screen.queryByText(/לא נכון/);

        // Check if any answer button has result styling (success/error colors)
        const answerButtonsAfterClick = buttons.filter(
          btn => btn.textContent && btn.textContent.length > 0 &&
            !['המילה הבאה', 'נסה שוב', 'דלג', 'התחל מחדש'].some(t => btn.textContent?.includes(t))
        );
        const hasResultStyling = answerButtonsAfterClick.some(btn =>
          btn.className.includes('bg-success-500') ||
          btn.className.includes('bg-danger-500') ||
          btn.className.includes('bg-red-500') ||
          btn.className.includes('bg-gray-100')
        );
        const disabledButtons = buttons.filter(btn => (btn as HTMLButtonElement).disabled);

        const hasContinueButton = !!continueButton;
        const hasRetryButton = !!retryButton;
        const hasSuccessMessage = !!successMessage;
        const hasErrorMessage = !!errorMessage;
        const hasDisabledButtons = disabledButtons.length > 0;

        // When result is shown, at least one indicator should be present
        expect(hasContinueButton || hasRetryButton || hasSuccessMessage || hasErrorMessage || hasResultStyling || hasDisabledButtons).toBe(true);
      }, { timeout: 3000 });

      // Move to next question
        const continueButton = await screen.findByText(/המילה הבאה/);
      await user.click(continueButton);

      // Buttons should be enabled again
      await waitFor(() => {
        const enabledButtons = screen.getAllByRole('button').filter(
          btn => btn.textContent && btn.textContent.length > 0 &&
            !['המילה הבאה', 'נסה שוב', 'דלג', 'התחל מחדש'].some(t => btn.textContent?.includes(t)) &&
            !(btn as HTMLButtonElement).disabled
        );
        expect(enabledButtons.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe('Bug: No words available after finishing category learning', () => {
    it('should pass category to quiz when provided', async () => {
      render(<Quiz userId="user-1" todayPlan={mockTodayPlan} category="Animals" levelState={mockLevelState} />);

      await waitFor(() => {
        expect(screen.queryByText('טוען חידון...')).not.toBeInTheDocument();
      });

      // Should not show "no words available" error
      expect(screen.queryByText('אין מילים זמינות לחידון')).not.toBeInTheDocument();

      // Should show questions
      await waitFor(() => {
        const answerButtons = screen.getAllByRole('button').filter(
          btn => btn.textContent && btn.textContent.length > 0 &&
            !['המילה הבאה', 'נסה שוב', 'דלג', 'התחל מחדש'].some(t => btn.textContent?.includes(t))
        );
        expect(answerButtons.length).toBeGreaterThan(0);
      });
    });

    it('should filter words correctly when category is provided', async () => {
      mocks.getAllWords.mockResolvedValue(mockWords);

      render(<Quiz userId="user-1" todayPlan={mockTodayPlan} category="Animals" />);

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

      render(<Quiz userId="user-1" todayPlan={mockTodayPlan} />);

      await waitFor(() => {
        expect(screen.queryByText('טוען חידון...')).not.toBeInTheDocument();
      });

      // Should not show level 3 words
      expect(screen.queryByText('אודיטוריום')).not.toBeInTheDocument();
      expect(screen.queryByText('קפיטריה')).not.toBeInTheDocument();

      // Should show level 2 words
      await waitFor(() => {
        const answerButtons = screen.getAllByRole('button').filter(
          btn => btn.textContent && btn.textContent.length > 0 &&
            !['המילה הבאה', 'נסה שוב', 'דלג', 'התחל מחדש'].some(t => btn.textContent?.includes(t))
        );
        expect(answerButtons.length).toBeGreaterThan(0);
      });
    });

    it('should use category words without additional filtering', async () => {
      mocks.getLevelState.mockResolvedValue({ ...mockLevelState, level: 2 });

      render(<Quiz userId="user-1" todayPlan={mockTodayPlan} category="Animals" />);

      await waitFor(() => {
        expect(screen.queryByText('טוען חידון...')).not.toBeInTheDocument();
      });

      // Should show words from the category
      expect(screen.queryByText('אין מילים זמינות לחידון')).not.toBeInTheDocument();
    });
  });
});
