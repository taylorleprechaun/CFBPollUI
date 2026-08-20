import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AlgorithmVersionPicker } from '../../../components/admin';

describe('AlgorithmVersionPicker', () => {
  it('adds a version to the selection when its button is clicked while unselected', async () => {
    const onChange = vi.fn();
    render(<AlgorithmVersionPicker onChange={onChange} selectedVersions={['V1']} />);

    await userEvent.click(screen.getByRole('button', { name: 'V2' }));

    expect(onChange).toHaveBeenCalledWith(['V1', 'V2']);
  });

  it('marks selected version buttons as pressed', () => {
    render(<AlgorithmVersionPicker onChange={vi.fn()} selectedVersions={['V2']} />);

    expect(screen.getByRole('button', { name: 'V1' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'V2' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('preserves canonical algorithm order when adding a version out of click order', async () => {
    const onChange = vi.fn();
    render(<AlgorithmVersionPicker onChange={onChange} selectedVersions={[]} />);

    await userEvent.click(screen.getByRole('button', { name: 'V2' }));

    expect(onChange).toHaveBeenCalledWith(['V2']);
  });

  it('removes a version from the selection when its button is clicked while selected', async () => {
    const onChange = vi.fn();
    render(<AlgorithmVersionPicker onChange={onChange} selectedVersions={['V1', 'V2']} />);

    await userEvent.click(screen.getByRole('button', { name: 'V1' }));

    expect(onChange).toHaveBeenCalledWith(['V2']);
  });

  it('renders a labelled group containing a button for every algorithm version', () => {
    render(<AlgorithmVersionPicker onChange={vi.fn()} selectedVersions={[]} />);

    expect(screen.getByRole('group', { name: 'Algorithm Version' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'V1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'V2' })).toBeInTheDocument();
  });
});
