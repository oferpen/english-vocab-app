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
  default: ({ title, actionLabel, onAction }: any) => (
    <div data-testid="celebration-screen">
      <h1>{title}</h1>
      <button onClick={onAction}>{actionLabel || 'חזור למפה'}</button>
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

  // Mock window.location
  const mockLocation = { href: '' };
  Object.defineProperty(window, 'location', {
    value: mockLocation,
    writable: true,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';
    mockMarkWordSeen.mockResolvedValue({});
    mockCompleteLearningSession.mockResolvedValue({ success: true, xpGained: 10 });
  });

  it('should navigate to quiz with category when finishing category learning', async () => {
    const user = userEvent.setup();
    render(<LearnToday userId="user-1" todayPlan={mockTodayPlan} category="Colors" level={2} />);

    // First word
    await screen.findByText('red');
    const nextButton = await screen.findByText(/המילה הבאה/);
    await user.click(nextButton);

    // Wait for second word to appear
    await waitFor(() => {
      expect(screen.getByText('blue')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Second word (last word, so button says "סיים יחידה!")
    // Find button by role and text content - wait a bit for button to update
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const btn = buttons.find(b => b.textContent?.includes('סיים יחידה') || b.textContent?.includes('סיים'));
      expect(btn).toBeTruthy();
    }, { timeout: 3000 });

    const buttons = screen.getAllByRole('button');
    const finishButton = buttons.find(b => b.textContent?.includes('סיים יחידה') || b.textContent?.includes('סיים'));
    expect(finishButton).toBeTruthy();
    if (finishButton) {
      await user.click(finishButton);
    }

    // Wait for celebration
    await waitFor(() => {
      expect(screen.getByTestId('celebration-screen')).toBeInTheDocument();
    }, { timeout: 3000 });

    const continueButton = screen.getByText(/עבור לחידון/);
    await user.click(continueButton);

    // The component uses window.location.href for navigation
    // Check if window.location.href was set with the correct URL
    await waitFor(() => {
      expect(mockLocation.href).toContain('category=Colors');
      expect(mockLocation.href).toContain('mode=quiz');
    }, { timeout: 5000 });
  });
});
