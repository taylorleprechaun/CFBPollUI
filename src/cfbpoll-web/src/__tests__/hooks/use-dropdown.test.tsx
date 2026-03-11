import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useDropdown } from '../../hooks/use-dropdown';

function TestDropdown() {
  const { containerRef, isOpen, toggle } = useDropdown();

  return (
    <div ref={containerRef}>
      <button onClick={toggle} aria-expanded={isOpen}>
        Toggle
      </button>
      {isOpen && <div>Dropdown Content</div>}
    </div>
  );
}

function renderDropdown() {
  return render(
    <MemoryRouter>
      <span>Outside</span>
      <TestDropdown />
    </MemoryRouter>
  );
}

describe('useDropdown', () => {
  it('starts closed', () => {
    renderDropdown();

    expect(screen.queryByText('Dropdown Content')).not.toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens on toggle', async () => {
    renderDropdown();

    await userEvent.click(screen.getByRole('button'));

    expect(screen.getByText('Dropdown Content')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes on second toggle', async () => {
    renderDropdown();

    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Dropdown Content')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button'));
    expect(screen.queryByText('Dropdown Content')).not.toBeInTheDocument();
  });

  it('closes on Escape key', async () => {
    renderDropdown();

    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Dropdown Content')).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByText('Dropdown Content')).not.toBeInTheDocument();
  });

  it('closes on click outside', async () => {
    renderDropdown();

    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Dropdown Content')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Outside'));
    expect(screen.queryByText('Dropdown Content')).not.toBeInTheDocument();
  });
});
