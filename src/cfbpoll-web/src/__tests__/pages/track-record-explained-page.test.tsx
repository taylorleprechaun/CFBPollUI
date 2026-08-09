import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TrackRecordExplainedPage } from '../../pages/track-record-explained-page';

function renderPage(initialEntry = '/track-record/explained') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <TrackRecordExplainedPage />
    </MemoryRouter>
  );
}

describe('TrackRecordExplainedPage', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('does not scroll when there is no hash', () => {
    renderPage('/track-record/explained');

    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it('renders a link back to the Track Record page', () => {
    renderPage();

    expect(screen.getByRole('link', { name: /Back to Track Record/ })).toHaveAttribute('href', '/track-record');
  });

  it('renders a section heading for each stat', () => {
    renderPage();

    expect(screen.getByRole('heading', { level: 2, name: 'Winner' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Spread' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Over/Under' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Margin RMSE' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Margin Bias' })).toBeInTheDocument();
  });

  it('renders the page heading', () => {
    renderPage();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Understanding the Track Record Stats');
  });

  it('renders the worked example table with the computed RMSE and Bias', () => {
    renderPage();

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Miss' })).toBeInTheDocument();
    expect(screen.getByText(/6.0 points/)).toBeInTheDocument();
    expect(screen.getByText(/1.0 points/)).toBeInTheDocument();
  });

  it('scrolls to the matching section when mounted with a location hash', () => {
    renderPage('/track-record/explained#margin-rmse');

    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });
});
