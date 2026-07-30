import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalculateSection } from '../../../components/admin';

const defaultProps = {
  isCalculating: false,
  onCalculate: vi.fn(),
  onSeasonChange: vi.fn(),
  onWeekChange: vi.fn(),
  seasons: [2024, 2023],
  seasonsLoading: false,
  selectedSeason: 2024,
  selectedWeek: 5,
  weeks: [
    { weekNumber: 1, label: 'Week 1', rankingsPublished: true },
    { weekNumber: 5, label: 'Week 5', rankingsPublished: false },
  ],
  weeksLoading: false,
};

describe('CalculateSection', () => {
  it('renders heading', () => {
    render(<CalculateSection {...defaultProps} />);

    expect(screen.getByText('Calculate Rankings')).toBeInTheDocument();
  });

  it('renders season and week selectors', () => {
    render(<CalculateSection {...defaultProps} />);

    expect(screen.getByLabelText('Season')).toBeInTheDocument();
    expect(screen.getByLabelText('Week')).toBeInTheDocument();
  });

  it('calls onCalculate when button is clicked', async () => {
    const onCalculate = vi.fn();
    render(<CalculateSection {...defaultProps} onCalculate={onCalculate} />);

    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    expect(onCalculate).toHaveBeenCalled();
  });

  it('shows Calculating... text when isCalculating is true', () => {
    render(<CalculateSection {...defaultProps} isCalculating={true} />);

    expect(screen.getByRole('button', { name: 'Calculating...' })).toBeDisabled();
  });

  it('disables button when season is null', () => {
    render(<CalculateSection {...defaultProps} selectedSeason={null} />);

    expect(screen.getByRole('button', { name: 'Calculate' })).toBeDisabled();
  });

  it('disables button when week is null', () => {
    render(<CalculateSection {...defaultProps} selectedWeek={null} />);

    expect(screen.getByRole('button', { name: 'Calculate' })).toBeDisabled();
  });

  it('calls onSeasonChange and onWeekChange when season changes', async () => {
    const onSeasonChange = vi.fn();
    const onWeekChange = vi.fn();
    render(<CalculateSection {...defaultProps} onSeasonChange={onSeasonChange} onWeekChange={onWeekChange} />);

    await userEvent.selectOptions(screen.getByLabelText('Season'), '2023');

    expect(onSeasonChange).toHaveBeenCalledWith(2023);
    expect(onWeekChange).toHaveBeenCalledWith(null);
  });

  it('calls onWeekChange when week changes', async () => {
    const onWeekChange = vi.fn();
    render(<CalculateSection {...defaultProps} onWeekChange={onWeekChange} />);

    await userEvent.selectOptions(screen.getByLabelText('Week'), '1');

    expect(onWeekChange).toHaveBeenCalledWith(1);
  });

  it('does not render refresh button when onRefreshCache is not provided', () => {
    render(<CalculateSection {...defaultProps} />);

    expect(screen.queryByRole('button', { name: 'Refresh Cached Data' })).not.toBeInTheDocument();
  });

  it('renders refresh button when onRefreshCache is provided', () => {
    render(<CalculateSection {...defaultProps} onRefreshCache={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Refresh Cached Data' })).toBeInTheDocument();
  });

  it('calls onRefreshCache when refresh button is clicked', async () => {
    const onRefreshCache = vi.fn();
    render(<CalculateSection {...defaultProps} onRefreshCache={onRefreshCache} />);

    await userEvent.click(screen.getByRole('button', { name: 'Refresh Cached Data' }));

    expect(onRefreshCache).toHaveBeenCalled();
  });

  it('shows Refreshing... text when isRefreshingCache is true', () => {
    render(<CalculateSection {...defaultProps} onRefreshCache={vi.fn()} isRefreshingCache={true} />);

    expect(screen.getByRole('button', { name: 'Refreshing...' })).toBeDisabled();
  });

  it('disables refresh button when season is null', () => {
    render(<CalculateSection {...defaultProps} onRefreshCache={vi.fn()} selectedSeason={null} />);

    expect(screen.getByRole('button', { name: 'Refresh Cached Data' })).toBeDisabled();
  });

  it('shows success feedback message matching the selected season and week', () => {
    render(
      <CalculateSection
        {...defaultProps}
        onRefreshCache={vi.fn()}
        refreshFeedback={{ key: 'refresh-cache-2024-5', type: 'success', message: 'Removed 8 cached entries' }}
      />
    );

    expect(screen.getByText('Removed 8 cached entries')).toBeInTheDocument();
  });

  it('shows error feedback message matching the selected season and week', () => {
    render(
      <CalculateSection
        {...defaultProps}
        onRefreshCache={vi.fn()}
        refreshFeedback={{ key: 'refresh-cache-2024-5', type: 'error', message: 'Refresh failed' }}
      />
    );

    expect(screen.getByText('Refresh failed')).toBeInTheDocument();
  });

  it('does not show feedback for a different season/week key', () => {
    render(
      <CalculateSection
        {...defaultProps}
        onRefreshCache={vi.fn()}
        refreshFeedback={{ key: 'refresh-cache-2023-1', type: 'success', message: 'Removed 3 cached entries' }}
      />
    );

    expect(screen.queryByText('Removed 3 cached entries')).not.toBeInTheDocument();
  });
});
