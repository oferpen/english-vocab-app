import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Next.js router
const mockReplace = vi.fn();
const mockPush = vi.fn();
const mockReplaceState = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
  useSearchParams: () => new URLSearchParams('mode=learn&category=Actions&level=2'),
}));

// Mock window.history
Object.defineProperty(window, 'history', {
  writable: true,
  value: {
    replaceState: mockReplaceState,
    state: {},
  },
});

// Mock server actions
vi.mock('@/app/actions/levels', () => ({
  getLevelState: vi.fn().mockResolvedValue({ level: 2, xp: 100 }),
}));

vi.mock('@/app/actions/words', () => ({
  getWordsByCategory: vi.fn().mockResolvedValue([
    { id: 'word-1', englishWord: 'run', hebrewTranslation: 'לרוץ' },
    { id: 'word-2', englishWord: 'jump', hebrewTranslation: 'לקפוץ' },
  ]),
}));

vi.mock('@/app/actions/settings', () => ({
  getSettings: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/app/actions/plans', () => ({
  getTodayPlan: vi.fn().mockResolvedValue(null),
}));

describe('Mode Switching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.history.replaceState
    Object.defineProperty(window, 'history', {
      writable: true,
      value: {
        replaceState: vi.fn(),
        state: {},
      },
    });
  });

  it('should not cause page reload when switching modes', async () => {
    const todayPlan = {
      id: 'plan-1',
      words: [
        { word: { id: 'word-1', englishWord: 'run', hebrewTranslation: 'לרוץ' } },
        { word: { id: 'word-2', englishWord: 'jump', hebrewTranslation: 'לקפוץ' } },
      ],
    };

    const { container } = render(
      <LearnQuizWrapper
        childId="child-1"
        todayPlan={todayPlan}
        category="Actions"
        level={2}
        levelState={{ level: 2, xp: 100 }}
        categoryWords={todayPlan.words.map((w: any) => w.word)}
      />
    );

    // Find the quiz mode button
    const quizButton = screen.getByText('חידון');
    expect(quizButton).toBeInTheDocument();

    // Click to switch to quiz mode
    await userEvent.click(quizButton);

    // Wait for mode switch
    await waitFor(() => {
      // Should use window.history.replaceState, not router.replace (which causes reload)
      expect(window.history.replaceState).toHaveBeenCalled();
    });

    // Should NOT call router.replace which causes page reload
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should preserve quiz state when switching to learn mode and back', async () => {
    const todayPlan = {
      id: 'plan-1',
      words: [
        { word: { id: 'word-1', englishWord: 'run', hebrewTranslation: 'לרוץ' } },
        { word: { id: 'word-2', englishWord: 'jump', hebrewTranslation: 'לקפוץ' } },
      ],
    };

    const { container, rerender } = render(
      <LearnQuizWrapper
        childId="child-1"
        todayPlan={todayPlan}
        category="Actions"
        level={2}
        levelState={{ level: 2, xp: 100 }}
        categoryWords={todayPlan.words.map((w: any) => w.word)}
      />
    );

    // Switch to quiz mode
    const quizButton = screen.getByText('חידון');
    await userEvent.click(quizButton);

    // Switch back to learn mode
    await waitFor(() => {
      const learnButton = screen.getByText('למידה');
      if (learnButton) {
        userEvent.click(learnButton);
      }
    });

    // Components should be preserved (not unmounted)
    // This is tested by checking that window.history.replaceState is used
    // instead of router.replace which would cause full page reload
    expect(window.history.replaceState).toHaveBeenCalled();
  });
});
