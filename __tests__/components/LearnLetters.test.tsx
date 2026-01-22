import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LearnLetters from '@/components/LearnLetters';
import { getAllLetters, getUnmasteredLetters, markLetterSeen } from '@/app/actions/letters';

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

describe('LearnLetters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUnmasteredLetters.mockClear();
    mockMarkLetterSeen.mockClear();
    mockCheckLevel1Complete.mockClear();
  });

  it('should display loading state initially', () => {
    mockGetUnmasteredLetters.mockImplementation(() => new Promise(() => {}));

    render(<LearnLetters childId="child-1" />);
    expect(screen.getByText('טוען אותיות...')).toBeInTheDocument();
  });

  it('should display letters when loaded', async () => {
    const mockLetters = [
      { id: 'letter-1', letter: 'A', name: 'A', hebrewName: 'איי', sound: '/eɪ/', order: 1 },
    ];

    mockGetUnmasteredLetters.mockResolvedValue(mockLetters);
    mockCheckLevel1Complete.mockResolvedValue(false);

    render(<LearnLetters childId="child-1" />);

    await waitFor(() => {
      // Look for the letter display, not just the text "A" which might appear multiple times
      expect(screen.getByText('איי')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('should mark letter as learned when button clicked', async () => {
    const user = userEvent.setup();
    const mockLetters = [
      { id: 'letter-1', letter: 'A', name: 'A', hebrewName: 'איי', sound: '/eɪ/', order: 1 },
    ];

    mockGetUnmasteredLetters.mockResolvedValue(mockLetters);
    mockMarkLetterSeen.mockResolvedValue({ mastered: false, timesSeen: 1, timesCorrect: 1 });

    render(<LearnLetters childId="child-1" />);

    await waitFor(() => {
      expect(screen.getByText('יודע! ✓')).toBeInTheDocument();
    });

    await user.click(screen.getByText('יודע! ✓'));

    await waitFor(() => {
      expect(mockMarkLetterSeen).toHaveBeenCalledWith('child-1', 'letter-1', true);
    });
  });

  it('should show celebration when level 1 complete', async () => {
    const mockLetters = [
      { id: 'letter-1', letter: 'A', name: 'A', order: 1 },
    ];

    mockGetUnmasteredLetters.mockResolvedValue(mockLetters);
    mockMarkLetterSeen.mockResolvedValue({ mastered: true, timesSeen: 3, timesCorrect: 3 });
    mockCheckLevel1Complete.mockResolvedValue(true);

    const user = userEvent.setup();
    render(<LearnLetters childId="child-1" />);

    await waitFor(() => {
      expect(screen.getByText('יודע! ✓')).toBeInTheDocument();
    });

    await user.click(screen.getByText('יודע! ✓'));

    await waitFor(() => {
      expect(screen.getByText(/כל הכבוד/)).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
