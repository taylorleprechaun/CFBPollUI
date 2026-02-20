import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PreviewSection } from '../../../components/admin';

const defaultResult = {
  persisted: true,
  rankings: {
    season: 2024,
    week: 5,
    rankings: [],
  },
};

const defaultProps = {
  calculatedResult: defaultResult,
  actionFeedback: null,
  isActionPending: false,
  onClearFeedback: vi.fn(),
  onExport: vi.fn(),
  onPublish: vi.fn(),
};

function renderPreview(props = {}) {
  return render(
    <MemoryRouter>
      <PreviewSection {...defaultProps} {...props} />
    </MemoryRouter>
  );
}

describe('PreviewSection', () => {
  it('renders preview heading with season and week', () => {
    renderPreview();

    expect(screen.getByText(/Preview: 2024 Week 6/)).toBeInTheDocument();
  });

  it('renders Download Excel and Publish buttons', () => {
    renderPreview();

    expect(screen.getByText('Download Excel')).toBeInTheDocument();
    expect(screen.getByText('Publish')).toBeInTheDocument();
  });

  it('calls onExport when Download Excel is clicked', () => {
    const onExport = vi.fn();
    renderPreview({ onExport });

    fireEvent.click(screen.getByText('Download Excel'));

    expect(onExport).toHaveBeenCalledWith(2024, 5);
  });

  it('calls onPublish when Publish is clicked', () => {
    const onPublish = vi.fn();
    renderPreview({ onPublish });

    fireEvent.click(screen.getByText('Publish'));

    expect(onPublish).toHaveBeenCalledWith(2024, 5, 'preview');
  });

  it('shows not-persisted warning when persisted is false', () => {
    renderPreview({
      calculatedResult: { ...defaultResult, persisted: false },
    });

    expect(screen.getByText(/Rankings were not persisted/)).toBeInTheDocument();
  });

  it('does not show warning when persisted is true', () => {
    renderPreview();

    expect(screen.queryByText(/Rankings were not persisted/)).not.toBeInTheDocument();
  });

  it('toggles expand/collapse on heading click', () => {
    renderPreview();

    const heading = screen.getByText(/Preview: 2024 Week 6/);

    expect(heading.textContent).toContain('\u25BC');

    fireEvent.click(heading);
    expect(heading.textContent).toContain('\u25B6');

    fireEvent.click(heading);
    expect(heading.textContent).toContain('\u25BC');
  });

  it('disables buttons when isActionPending is true', () => {
    renderPreview({ isActionPending: true });

    expect(screen.getByText('Download Excel')).toBeDisabled();
    expect(screen.getByText('Publish')).toBeDisabled();
  });

  it('shows success checkmark for matching feedback', () => {
    renderPreview({
      actionFeedback: {
        key: 'preview-publish-2024-5',
        type: 'success',
      },
    });

    expect(screen.getByLabelText('Success')).toBeInTheDocument();
  });

  it('shows error message for matching feedback', () => {
    renderPreview({
      actionFeedback: {
        key: 'preview-publish-2024-5',
        type: 'error',
        message: 'Server error',
      },
    });

    expect(screen.getByText('Server error')).toBeInTheDocument();
  });
});
