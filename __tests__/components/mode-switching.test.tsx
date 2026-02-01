import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LearnQuizWrapper from '@/components/LearnQuizWrapper';

// Mock Next.js router
const mockReplace = vi.fn();
const mockPush = vi.fn();
const mockReplaceState = vi.fn();
let mockSearchParams = new URLSearchParams('mode=learn&category=Actions&level=2');

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
  useTransition: () => [false, (fn: any) => fn()],
}));

// Mock server actions
vi.mock('@/app/actions/levels', () => ({
  getLevelState: vi.fn().mockResolvedValue({ level: 2, xp: 100 }),
}));

vi.mock('@/app/actions/words', () => ({
  getWordsByCategory: vi.fn().mockResolvedValue([
    { id: 'word-1', englishWord: 'run', hebrewTranslation: 'לרוץ' },
    { id: 'word-2', englishWord: 'jump', hebrewTranslation: 'לקפוץ' },
  ]),
  getAllWords: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/app/actions/settings', () => ({
  getSettings: vi.fn().mockResolvedValue({
    questionTypes: {
      enToHe: true,
      heToEn: true,
      audioToEn: false,
    },
  }),
}));

vi.mock('@/app/actions/letters', () => ({
  getAllLetters: vi.fn().mockResolvedValue([]),
  getUnmasteredLetters: vi.fn().mockResolvedValue([]),
  markLetterSeen: vi.fn(),
  checkLevel1Complete: vi.fn().mockResolvedValue(false),
}));

describe('Mode Switching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams('mode=learn&category=Actions&level=2');

    // Mock window.history.replaceState
    Object.defineProperty(window, 'history', {
      writable: true,
      value: {
        replaceState: vi.fn((state, title, url) => {
          mockReplaceState(state, title, url);
          // Update mock params when replaceState is called
          if (url && typeof url === 'string' && url.includes('?')) {
            const queryString = url.split('?')[1];
            mockSearchParams = new URLSearchParams(queryString);
          }
        }),
        state: {},
      },
    });
  });

  it('should not cause page reload when switching modes', async () => {
    const user = userEvent.setup();
    const userId = 'user-1';
    const todayPlan = {
      id: 'plan-1',
      words: [
        { word: { id: 'word-1', englishWord: 'run', hebrewTranslation: 'לרוץ' } },
        { word: { id: 'word-2', englishWord: 'jump', hebrewTranslation: 'לקפוץ' } },
      ],
    };

    render(
      <LearnQuizWrapper
        userId={userId}
        todayPlan={todayPlan}
        category="Actions"
        level={2}
        levelState={{ level: 2, xp: 100 }}
        categoryWords={todayPlan.words.map((w: any) => w.word)}
      />
    );

    // Find the quiz mode button (חידון)
    // Using findByText as there might be a small delay in rendering
    const quizButton = await screen.findByText('חידון');
    expect(quizButton).toBeInTheDocument();

    // Click to switch to quiz mode
    await user.click(quizButton);

    // Wait for mode switch
    await waitFor(() => {
      // Should use window.history.replaceState, not router.replace (which causes reload)
      expect(mockReplaceState).toHaveBeenCalled();
    });

    // Should NOT call router.replace which causes page reload
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
