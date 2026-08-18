import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { ExperimentalPredictionsPreviewSection } from '../../../components/admin';

const defaultResult = {
  algorithmVersion: 'V2',
  predictions: [],
  summary: {
    gradedGameCount: 0,
    marginBias: null,
    marginMAE: null,
    marginRMSE: null,
    overUnder: { correct: 0, incorrect: 0, push: 0 },
    spread: { correct: 0, incorrect: 0, push: 0 },
    winner: { correct: 0, incorrect: 0, push: 0 },
  },
};

const defaultProps = {
  calculatedResult: defaultResult,
  season: 2024,
  week: 5,
};

function renderPreview(props = {}) {
  return render(
    <MemoryRouter>
      <ExperimentalPredictionsPreviewSection {...defaultProps} {...props} />
    </MemoryRouter>
  );
}

describe('ExperimentalPredictionsPreviewSection', () => {
  it('renders predictions table headers', () => {
    renderPreview();

    expect(screen.getByText('Score')).toBeInTheDocument();
  });

  it('renders preview heading with algorithm version, season, and week', () => {
    renderPreview();

    expect(screen.getByText(/Preview \(V2\): 2024 Week 6/)).toBeInTheDocument();
  });

  it('renders the summary section', () => {
    renderPreview();

    expect(screen.getByText(/hasn't been played yet/)).toBeInTheDocument();
  });

  it('toggles aria-expanded on the header button and points aria-controls at the content region', () => {
    renderPreview();

    const headerButton = screen.getByText(/Preview \(V2\): 2024 Week 6/).closest('button')!;
    expect(headerButton).toHaveAttribute('aria-expanded', 'true');

    const contentId = headerButton.getAttribute('aria-controls');
    expect(contentId).toBeTruthy();
    expect(document.getElementById(contentId!)).not.toBeNull();

    fireEvent.click(headerButton);
    expect(headerButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('toggles expand/collapse on heading click', () => {
    renderPreview();

    const heading = screen.getByText(/Preview \(V2\): 2024 Week 6/);
    const chevron = () => heading.closest('button')!.querySelector('svg')!;

    expect(chevron().classList.toString()).not.toContain('-rotate-90');

    fireEvent.click(heading);
    expect(chevron().classList.toString()).toContain('-rotate-90');

    fireEvent.click(heading);
    expect(chevron().classList.toString()).not.toContain('-rotate-90');
  });
});
