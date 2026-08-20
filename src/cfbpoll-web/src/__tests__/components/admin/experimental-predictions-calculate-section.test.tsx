import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { AlgorithmVersion } from '../../../components/admin';

import { ExperimentalPredictionsCalculateSection } from '../../../components/admin';

const defaultProps = {
  isRunning: false,
  onCompareSeasonClick: vi.fn(),
  onRun: vi.fn(),
  onSeasonChange: vi.fn(),
  onSelectedVersionsChange: vi.fn(),
  onWeekChange: vi.fn(),
  seasons: [2024, 2023],
  seasonsLoading: false,
  selectedSeason: 2024,
  selectedVersions: ['V1'] as AlgorithmVersion[],
  selectedWeek: 5,
  weeks: [
    { weekNumber: 1, label: 'Week 1', predictionsPublished: false, rankingsPublished: true },
    { weekNumber: 5, label: 'Week 5', predictionsPublished: false, rankingsPublished: false },
  ],
  weeksLoading: false,
};

describe('ExperimentalPredictionsCalculateSection', () => {
  it('calls onCompareSeasonClick when the Compare Season button is clicked', async () => {
    const onCompareSeasonClick = vi.fn();
    render(<ExperimentalPredictionsCalculateSection {...defaultProps} onCompareSeasonClick={onCompareSeasonClick} />);

    await userEvent.click(screen.getByRole('button', { name: 'Compare Season' }));

    expect(onCompareSeasonClick).toHaveBeenCalled();
  });

  it('calls onRun when the Calculate Predictions button is clicked', async () => {
    const onRun = vi.fn();
    render(<ExperimentalPredictionsCalculateSection {...defaultProps} onRun={onRun} />);

    await userEvent.click(screen.getByRole('button', { name: 'Calculate Predictions' }));

    expect(onRun).toHaveBeenCalled();
  });

  it('calls onSeasonChange and onWeekChange when season changes', async () => {
    const onSeasonChange = vi.fn();
    const onWeekChange = vi.fn();
    render(<ExperimentalPredictionsCalculateSection {...defaultProps} onSeasonChange={onSeasonChange} onWeekChange={onWeekChange} />);

    await userEvent.selectOptions(screen.getByLabelText('Season'), '2023');

    expect(onSeasonChange).toHaveBeenCalledWith(2023);
    expect(onWeekChange).toHaveBeenCalledWith(null);
  });

  it('calls onSelectedVersionsChange when an algorithm version is toggled', async () => {
    const onSelectedVersionsChange = vi.fn();
    render(<ExperimentalPredictionsCalculateSection {...defaultProps} onSelectedVersionsChange={onSelectedVersionsChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'V2' }));

    expect(onSelectedVersionsChange).toHaveBeenCalledWith(['V1', 'V2']);
  });

  it('calls onWeekChange when week changes', async () => {
    const onWeekChange = vi.fn();
    render(<ExperimentalPredictionsCalculateSection {...defaultProps} onWeekChange={onWeekChange} />);

    await userEvent.selectOptions(screen.getByLabelText('Week'), '1');

    expect(onWeekChange).toHaveBeenCalledWith(1);
  });

  it('disables the button when no algorithm versions are selected', () => {
    render(<ExperimentalPredictionsCalculateSection {...defaultProps} selectedVersions={[]} />);

    expect(screen.getByRole('button', { name: 'Calculate Predictions' })).toBeDisabled();
  });

  it('disables the button when season is null', () => {
    render(<ExperimentalPredictionsCalculateSection {...defaultProps} selectedSeason={null} />);

    expect(screen.getByRole('button', { name: 'Calculate Predictions' })).toBeDisabled();
  });

  it('disables the button when week is null', () => {
    render(<ExperimentalPredictionsCalculateSection {...defaultProps} selectedWeek={null} />);

    expect(screen.getByRole('button', { name: 'Calculate Predictions' })).toBeDisabled();
  });

  it('disables the Compare Season button when no weeks are loaded', () => {
    render(<ExperimentalPredictionsCalculateSection {...defaultProps} weeks={[]} />);

    expect(screen.getByRole('button', { name: 'Compare Season' })).toBeDisabled();
  });

  it('disables the Compare Season button when season is null', () => {
    render(<ExperimentalPredictionsCalculateSection {...defaultProps} selectedSeason={null} />);

    expect(screen.getByRole('button', { name: 'Compare Season' })).toBeDisabled();
  });

  it('renders heading', () => {
    render(<ExperimentalPredictionsCalculateSection {...defaultProps} />);

    expect(screen.getByText('Experimental Predictions')).toBeInTheDocument();
  });

  it('renders season, week, and algorithm version selectors', () => {
    render(<ExperimentalPredictionsCalculateSection {...defaultProps} />);

    expect(screen.getByLabelText('Season')).toBeInTheDocument();
    expect(screen.getByLabelText('Week')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Algorithm Version' })).toBeInTheDocument();
  });

  it('shows Calculating... text when isRunning is true', () => {
    render(<ExperimentalPredictionsCalculateSection {...defaultProps} isRunning={true} />);

    expect(screen.getByRole('button', { name: 'Calculating...' })).toBeDisabled();
  });
});
