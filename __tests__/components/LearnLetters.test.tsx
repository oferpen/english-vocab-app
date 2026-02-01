import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LearnLetters from '@/components/LearnLetters';

const mockGetUnmasteredLetters = vi.fn();
const mockMarkLetterSeen = vi.fn();
const mockCheckLevel1Complete = vi.fn();

vi.mock('@/app/actions/letters', () => ({
  getAllLetters: vi.fn(),
  getUnmasteredLetters: (...args: any[]) => mockGetUnmasteredLetters(...args),
  markLetterSeen: (...args: any[]) => mockMarkLetterSeen(...args),
  checkLevel1Complete: (...args: any[]) => mockCheckLevel1Complete(...args),
}));

vi.mock('@/app/actions/levels', () => ({
  addXP: vi.fn(),
  checkAndUnlockLevel2: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@/lib/sounds', () => ({
  playSuccessSound: vi.fn(),
}));

// Mock useTransition to behave synchronously in tests
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useTransition: () => [false, (fn: Function) => fn()],
  };
});

describe('LearnLetters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading state initially', () => {
    mockGetUnmasteredLetters.mockImplementation(() => new Promise(() => { }));
    render(<LearnLetters userId="user-1" />);
    expect(screen.getByText('טוען אותיות...')).toBeInTheDocument();
  });

  it('should display letters when loaded', async () => {
    const mockLetters = [
      { id: 'letter-1', letter: 'A', name: 'A', hebrewName: 'איי', sound: '/eɪ/', order: 1 },
    ];
    mockGetUnmasteredLetters.mockResolvedValue(mockLetters);
    mockCheckLevel1Complete.mockResolvedValue(false);

    render(<LearnLetters userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText('איי')).toBeInTheDocument();
    });
  });

  it('should mark letter as learned when button clicked', async () => {
    const user = userEvent.setup();
    const mockLetters = [
      { id: 'letter-1', letter: 'A', name: 'A', hebrewName: 'איי', sound: '/eɪ/', order: 1 },
    ];
    mockGetUnmasteredLetters.mockResolvedValue(mockLetters);
    mockMarkLetterSeen.mockResolvedValue({ mastered: false, timesSeen: 1, timesCorrect: 1 });
    mockCheckLevel1Complete.mockResolvedValue(false);

    render(<LearnLetters userId="user-1" />);

    // Wait for letters to load
    await waitFor(() => {
      expect(screen.queryByText('איי')).toBeInTheDocument();
    });

    const knownButton = screen.getByText('יודע!');
    await user.click(knownButton);

    await waitFor(() => {
      expect(mockMarkLetterSeen).toHaveBeenCalledWith('user-1', 'letter-1', true);
    });
  });
});
