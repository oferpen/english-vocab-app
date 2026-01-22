import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChildSwitcher from '@/components/ChildSwitcher';
import { getAllChildren, setActiveChild } from '@/app/actions/children';

vi.mock('@/app/actions/children', () => ({
  getAllChildren: vi.fn(),
  setActiveChild: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

describe('ChildSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render if only one child', async () => {
    (getAllChildren as any).mockResolvedValue([
      { id: 'child-1', name: 'ילד א' },
    ]);

    const { container } = render(
      <ChildSwitcher currentChildId="child-1" currentChildName="ילד א" />
    );

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('should show switcher button when multiple children', async () => {
    (getAllChildren as any).mockResolvedValue([
      { id: 'child-1', name: 'ילד א', avatar: '👶' },
      { id: 'child-2', name: 'ילד ב', avatar: '👧' },
    ]);

    render(<ChildSwitcher currentChildId="child-1" currentChildName="ילד א" />);

    await waitFor(() => {
      expect(screen.getByText('🔄 החלף ילד')).toBeInTheDocument();
    });
  });

  it('should open modal when button clicked', async () => {
    const user = userEvent.setup();
    (getAllChildren as any).mockResolvedValue([
      { id: 'child-1', name: 'ילד א', avatar: '👶' },
      { id: 'child-2', name: 'ילד ב', avatar: '👧' },
    ]);

    render(<ChildSwitcher currentChildId="child-1" currentChildName="ילד א" />);

    await waitFor(() => {
      expect(screen.getByText('🔄 החלף ילד')).toBeInTheDocument();
    });

    await user.click(screen.getByText('🔄 החלף ילד'));

    await waitFor(() => {
      expect(screen.getByText('בחר ילד')).toBeInTheDocument();
    });
  });

  it('should switch child when clicked', async () => {
    const user = userEvent.setup();
    (getAllChildren as any).mockResolvedValue([
      { id: 'child-1', name: 'ילד א', avatar: '👶' },
      { id: 'child-2', name: 'ילד ב', avatar: '👧' },
    ]);
    (setActiveChild as any).mockResolvedValue({});

    render(<ChildSwitcher currentChildId="child-1" currentChildName="ילד א" />);

    await waitFor(() => {
      expect(screen.getByText('🔄 החלף ילד')).toBeInTheDocument();
    });

    await user.click(screen.getByText('🔄 החלף ילד'));
    await waitFor(() => {
      expect(screen.getByText('בחר ילד')).toBeInTheDocument();
    });

    await user.click(screen.getByText('ילד ב'));

    await waitFor(() => {
      expect(setActiveChild).toHaveBeenCalledWith('child-2');
    });
  });
});
