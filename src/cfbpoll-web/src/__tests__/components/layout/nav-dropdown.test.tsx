import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { NavDropdown } from '../../../components/layout/nav-dropdown';

const items = [
  { label: 'Rankings', to: '/rankings' },
  { label: 'Teams', to: '/team-details' },
  { label: 'Trends', to: '/season-trends' },
];

function renderDropdown(props: Partial<Parameters<typeof NavDropdown>[0]> = {}) {
  return render(
    <MemoryRouter>
      <NavDropdown
        isActive={false}
        items={items}
        label="Rankings"
        {...props}
      />
    </MemoryRouter>
  );
}

describe('NavDropdown', () => {
  it('renders the label button', () => {
    renderDropdown();

    expect(screen.getByRole('button', { name: /Rankings/i })).toBeInTheDocument();
  });

  it('dropdown is closed by default', () => {
    renderDropdown();

    expect(screen.queryByText('Teams')).not.toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens dropdown on click', async () => {
    renderDropdown();

    await userEvent.click(screen.getByRole('button', { name: /Rankings/i }));

    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('Trends')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Rankings/i })).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes dropdown on second click', async () => {
    renderDropdown();

    const button = screen.getByRole('button', { name: /Rankings/i });
    await userEvent.click(button);
    expect(screen.getByText('Teams')).toBeInTheDocument();

    await userEvent.click(button);
    expect(screen.queryByText('Teams')).not.toBeInTheDocument();
  });

  it('closes dropdown on Escape', async () => {
    renderDropdown();

    await userEvent.click(screen.getByRole('button', { name: /Rankings/i }));
    expect(screen.getByText('Teams')).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByText('Teams')).not.toBeInTheDocument();
  });

  it('closes dropdown on click outside', async () => {
    render(
      <MemoryRouter>
        <div>
          <span>Outside</span>
          <NavDropdown isActive={false} items={items} label="Rankings" />
        </div>
      </MemoryRouter>
    );

    await userEvent.click(screen.getByRole('button', { name: /Rankings/i }));
    expect(screen.getByText('Teams')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Outside'));
    expect(screen.queryByText('Teams')).not.toBeInTheDocument();
  });

  it('has aria-haspopup attribute', () => {
    renderDropdown();

    expect(screen.getByRole('button')).toHaveAttribute('aria-haspopup', 'true');
  });

  it('applies active styling when isActive is true', () => {
    renderDropdown({ isActive: true });

    const button = screen.getByRole('button', { name: /Rankings/i });
    expect(button.className).toContain('bg-nav-active');
  });

  it('applies inactive styling when isActive is false', () => {
    renderDropdown({ isActive: false });

    const button = screen.getByRole('button', { name: /Rankings/i });
    expect(button.className).not.toContain('bg-nav-active');
  });

  it('renders all items as links', async () => {
    renderDropdown();

    await userEvent.click(screen.getByRole('button', { name: /Rankings/i }));

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);
  });
});
