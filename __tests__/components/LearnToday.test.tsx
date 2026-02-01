import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LearnToday from '@/components/LearnToday';

const mockMarkWordSeen = vi.fn();
const mockCompleteLearningSession = vi.fn();
const mockRouterPush = vi.fn();

vi.mock('@/app/actions/progress', () => ({
  markWordSeen: (...args: any[]) => mockMarkWordSeen(...args),
}));

vi.mock('@/app/actions/learning', () => ({
  completeLearningSession: (...args: any[]) => mockCompleteLearningSession(...args),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/sounds', () => ({
  playSuccessSound: vi.fn(),
}));

// Mock sub-components to simplify testing
vi.mock('@/components/Confetti', () => ({
  default: () => <div data-testid="confetti" />
}));

vi.mock('@/components/CelebrationScreen', () => ({
  default: ({ title, onAction }: any) => (
    <div data-testid="celebration-screen">
      <h1>{title}</h1>
      <button onClick={onAction}>חזור למפה</button>
    </div>
  )
}));

// Mock useTransition to behave synchronously in tests
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useTransition: () => [false, (fn: Function) => fn()],
  };
});

describe('LearnToday - Bug Fixes', () => {
  const mockTodayPlan = {
    id: 'category-Colors-level-2',
    userId: 'user-1',
    date: '2024-01-01',
    words: [
      { word: { id: 'word-1', englishWord: 'red', hebrewTranslation: 'אדום', level: 2, category: 'Colors' } },
      { word: { id: 'word-2', englishWord: 'blue', hebrewTranslation: 'כחול', level: 2, category: 'Colors' } },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMarkWordSeen.mockResolvedValue({});
    mockCompleteLearningSession.mockResolvedValue({ success: true, xpGained: 10 });
  });

  it('should navigate to quiz with category when finishing category learning', async () => {
    const user = userEvent.setup();
    render(<LearnToday userId="user-1" todayPlan={mockTodayPlan} category="Colors" level={2} />);

    // First word
    await screen.findByText('red');
    await user.click(screen.getByText('הבא'));

    // Second word
    await screen.findByText('blue');
    await user.click(screen.getByText('הבא'));

    // Wait for celebration
    await waitFor(() => {
      expect(screen.getByTestId('celebration-screen')).toBeInTheDocument();
    });

    const continueButton = screen.getByText(/חזור למפה/);
    await user.click(continueButton);

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalled();
      const lastCall = mockRouterPush.mock.calls[0][0];
      expect(lastCall).toContain('category=Colors');
    });
  });
});
