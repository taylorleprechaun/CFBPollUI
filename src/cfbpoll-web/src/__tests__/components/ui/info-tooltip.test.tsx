import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { InfoTooltip } from '../../../components/ui/info-tooltip';

function renderTooltip() {
  return render(
    <MemoryRouter>
      <InfoTooltip statName="Margin RMSE" summary="The typical size of the miss, in points." anchor="margin-rmse" />
    </MemoryRouter>
  );
}

describe('InfoTooltip', () => {
  it('closes on Escape key while open', async () => {
    renderTooltip();

    await userEvent.click(screen.getByRole('button', { name: 'About Margin RMSE' }));
    expect(screen.getByText('The typical size of the miss, in points.')).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByText('The typical size of the miss, in points.')).not.toBeInTheDocument();
  });

  it('closes on outside click while open', async () => {
    render(
      <MemoryRouter>
        <span>Outside</span>
        <InfoTooltip statName="Margin RMSE" summary="The typical size of the miss, in points." anchor="margin-rmse" />
      </MemoryRouter>
    );

    await userEvent.click(screen.getByRole('button', { name: 'About Margin RMSE' }));
    expect(screen.getByText('The typical size of the miss, in points.')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Outside'));
    expect(screen.queryByText('The typical size of the miss, in points.')).not.toBeInTheDocument();
  });

  it('does not close when tabbing from the trigger onto the internal link', async () => {
    renderTooltip();

    await userEvent.click(screen.getByRole('button', { name: 'About Margin RMSE' }));
    await userEvent.tab();

    expect(screen.getByRole('link', { name: 'Full explanation of Margin RMSE' })).toHaveFocus();
  });

  it('hides the summary until opened', () => {
    renderTooltip();

    expect(screen.queryByText('The typical size of the miss, in points.')).not.toBeInTheDocument();
  });

  it('links to the explanation page anchor for the stat', async () => {
    renderTooltip();

    await userEvent.click(screen.getByRole('button', { name: 'About Margin RMSE' }));

    const link = screen.getByRole('link', { name: 'Full explanation of Margin RMSE' });
    expect(link).toHaveAttribute('href', '/track-record/explained#margin-rmse');
  });

  it('opens on click', async () => {
    renderTooltip();

    await userEvent.click(screen.getByRole('button', { name: 'About Margin RMSE' }));

    expect(screen.getByText('The typical size of the miss, in points.')).toBeInTheDocument();
  });

  it('opens on focus', async () => {
    renderTooltip();

    await userEvent.tab();

    expect(screen.getByText('The typical size of the miss, in points.')).toBeInTheDocument();
  });

  it('opens on hover', async () => {
    renderTooltip();

    await userEvent.hover(screen.getByRole('button', { name: 'About Margin RMSE' }));

    expect(screen.getByText('The typical size of the miss, in points.')).toBeInTheDocument();
  });

  it('renders the trigger button with the correct aria-label', () => {
    renderTooltip();

    expect(screen.getByRole('button', { name: 'About Margin RMSE' })).toBeInTheDocument();
  });
});
