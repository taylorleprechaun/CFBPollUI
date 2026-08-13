import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { ExperimentalPreviewSection } from '../../../components/admin';

const defaultResult = {
  algorithmVersion: 'V2',
  rankings: {
    season: 2024,
    week: 5,
    rankings: [],
  },
};

const defaultProps = {
  calculatedResult: defaultResult,
  isExporting: false,
  onExport: vi.fn(),
};

function renderPreview(props = {}) {
  return render(
    <MemoryRouter>
      <ExperimentalPreviewSection {...defaultProps} {...props} />
    </MemoryRouter>
  );
}

describe('ExperimentalPreviewSection', () => {
  it('calls onExport when Download Excel is clicked', () => {
    const onExport = vi.fn();
    renderPreview({ onExport });

    fireEvent.click(screen.getByText('Download Excel'));

    expect(onExport).toHaveBeenCalled();
  });

  it('disables the export button when isExporting is true', () => {
    renderPreview({ isExporting: true });

    expect(screen.getByText('Exporting...')).toBeDisabled();
  });

  it('renders Download Excel button', () => {
    renderPreview();

    expect(screen.getByText('Download Excel')).toBeInTheDocument();
  });

  it('renders preview heading with algorithm version, season, and week', () => {
    renderPreview();

    expect(screen.getByText(/Preview \(V2\): 2024 Week 6/)).toBeInTheDocument();
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
