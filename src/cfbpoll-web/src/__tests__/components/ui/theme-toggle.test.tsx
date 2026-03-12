import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '../../../components/ui/theme-toggle';

const mockSetTheme = vi.fn();

vi.mock('../../../contexts/theme-context', () => ({
  useTheme: () => ({
    resolvedTheme: mockResolvedTheme,
    setTheme: mockSetTheme,
    theme: mockResolvedTheme,
  }),
}));

let mockResolvedTheme: 'light' | 'dark' = 'light';

describe('ThemeToggle', () => {
  it('calls setTheme with dark when current theme is light', async () => {
    const user = userEvent.setup();
    mockResolvedTheme = 'light';

    render(<ThemeToggle />);

    await user.click(screen.getByRole('button'));

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('calls setTheme with light when current theme is dark', async () => {
    const user = userEvent.setup();
    mockResolvedTheme = 'dark';

    render(<ThemeToggle />);

    await user.click(screen.getByRole('button'));

    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('shows switch to light mode label when theme is dark', () => {
    mockResolvedTheme = 'dark';

    render(<ThemeToggle />);

    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Switch to light mode');
  });

  it('shows switch to dark mode label when theme is light', () => {
    mockResolvedTheme = 'light';

    render(<ThemeToggle />);

    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Switch to dark mode');
  });
});
