import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { YearRangeSelector } from '../../../components/poll-leaders/year-range-selector';

describe('YearRangeSelector', () => {
  it('renders two sliders with correct aria-labels', () => {
    render(
      <YearRangeSelector
        maxAvailable={2024}
        maxSeason={2024}
        minAvailable={2002}
        minSeason={2002}
        onMaxSeasonChange={vi.fn()}
        onMinSeasonChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Minimum year')).toBeInTheDocument();
    expect(screen.getByLabelText('Maximum year')).toBeInTheDocument();
  });

  it('min slider value reflects minSeason prop', () => {
    render(
      <YearRangeSelector
        maxAvailable={2024}
        maxSeason={2024}
        minAvailable={2002}
        minSeason={2010}
        onMaxSeasonChange={vi.fn()}
        onMinSeasonChange={vi.fn()}
      />
    );

    const minSlider = screen.getByLabelText('Minimum year') as HTMLInputElement;
    expect(minSlider.value).toBe('2010');
  });

  it('max slider value reflects maxSeason prop', () => {
    render(
      <YearRangeSelector
        maxAvailable={2024}
        maxSeason={2020}
        minAvailable={2002}
        minSeason={2002}
        onMaxSeasonChange={vi.fn()}
        onMinSeasonChange={vi.fn()}
      />
    );

    const maxSlider = screen.getByLabelText('Maximum year') as HTMLInputElement;
    expect(maxSlider.value).toBe('2020');
  });

  it('min slider clamps value to max season', () => {
    const handleMinChange = vi.fn();
    render(
      <YearRangeSelector
        maxAvailable={2024}
        maxSeason={2010}
        minAvailable={2002}
        minSeason={2002}
        onMaxSeasonChange={vi.fn()}
        onMinSeasonChange={handleMinChange}
      />
    );

    fireEvent.change(screen.getByLabelText('Minimum year'), { target: { value: '2015' } });

    expect(handleMinChange).toHaveBeenCalledWith(2010);
  });

  it('max slider clamps value to min season', () => {
    const handleMaxChange = vi.fn();
    render(
      <YearRangeSelector
        maxAvailable={2024}
        maxSeason={2024}
        minAvailable={2002}
        minSeason={2015}
        onMaxSeasonChange={handleMaxChange}
        onMinSeasonChange={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText('Maximum year'), { target: { value: '2010' } });

    expect(handleMaxChange).toHaveBeenCalledWith(2015);
  });

  it('calls onMinSeasonChange with correct value', () => {
    const handleMinChange = vi.fn();
    render(
      <YearRangeSelector
        maxAvailable={2024}
        maxSeason={2024}
        minAvailable={2002}
        minSeason={2002}
        onMaxSeasonChange={vi.fn()}
        onMinSeasonChange={handleMinChange}
      />
    );

    fireEvent.change(screen.getByLabelText('Minimum year'), { target: { value: '2010' } });

    expect(handleMinChange).toHaveBeenCalledWith(2010);
  });

  it('calls onMaxSeasonChange with correct value', () => {
    const handleMaxChange = vi.fn();
    render(
      <YearRangeSelector
        maxAvailable={2024}
        maxSeason={2024}
        minAvailable={2002}
        minSeason={2002}
        onMaxSeasonChange={handleMaxChange}
        onMinSeasonChange={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText('Maximum year'), { target: { value: '2020' } });

    expect(handleMaxChange).toHaveBeenCalledWith(2020);
  });

  it('displays selected year values', () => {
    render(
      <YearRangeSelector
        maxAvailable={2024}
        maxSeason={2020}
        minAvailable={2002}
        minSeason={2010}
        onMaxSeasonChange={vi.fn()}
        onMinSeasonChange={vi.fn()}
      />
    );

    expect(screen.getByText('2010')).toBeInTheDocument();
    expect(screen.getByText('2020')).toBeInTheDocument();
  });

  it('sets aria-valuemin, aria-valuemax, and aria-valuenow on sliders', () => {
    render(
      <YearRangeSelector
        maxAvailable={2024}
        maxSeason={2020}
        minAvailable={2002}
        minSeason={2010}
        onMaxSeasonChange={vi.fn()}
        onMinSeasonChange={vi.fn()}
      />
    );

    const minSlider = screen.getByLabelText('Minimum year');
    expect(minSlider).toHaveAttribute('aria-valuemin', '2002');
    expect(minSlider).toHaveAttribute('aria-valuemax', '2024');
    expect(minSlider).toHaveAttribute('aria-valuenow', '2010');

    const maxSlider = screen.getByLabelText('Maximum year');
    expect(maxSlider).toHaveAttribute('aria-valuemin', '2002');
    expect(maxSlider).toHaveAttribute('aria-valuemax', '2024');
    expect(maxSlider).toHaveAttribute('aria-valuenow', '2020');
  });

  it('handles equal min and max available values', () => {
    render(
      <YearRangeSelector
        maxAvailable={2024}
        maxSeason={2024}
        minAvailable={2024}
        minSeason={2024}
        onMaxSeasonChange={vi.fn()}
        onMinSeasonChange={vi.fn()}
      />
    );

    const minSlider = screen.getByLabelText('Minimum year') as HTMLInputElement;
    const maxSlider = screen.getByLabelText('Maximum year') as HTMLInputElement;
    expect(minSlider.value).toBe('2024');
    expect(maxSlider.value).toBe('2024');
  });
});
