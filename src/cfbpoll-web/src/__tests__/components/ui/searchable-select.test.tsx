import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { SearchableSelect } from '../../../components/ui/searchable-select';

const TEAMS = ['Florida', 'Iowa', 'Michigan', 'Notre Dame', 'Ohio State'];

interface HarnessProps {
  disabled?: boolean;
  excludedOptions?: string[];
  initialValue?: string | null;
  onChange?: (value: string | null) => void;
}

function Harness({ disabled, excludedOptions, initialValue = null, onChange }: HarnessProps) {
  const [value, setValue] = useState<string | null>(initialValue);

  function handleChange(next: string | null) {
    setValue(next);
    onChange?.(next);
  }

  return (
    <SearchableSelect
      disabled={disabled}
      excludedOptions={excludedOptions}
      label="Home Team"
      onChange={handleChange}
      options={TEAMS}
      value={value}
    />
  );
}

describe('SearchableSelect', () => {
  it('clears the value when the clear button is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Harness initialValue="Iowa" onChange={handleChange} />);

    await user.click(screen.getByRole('button', { name: 'Clear Home Team' }));

    expect(handleChange).toHaveBeenCalledWith(null);
    expect(screen.getByRole('combobox', { name: 'Home Team' })).toHaveValue('');
  });

  it('closes the list on Escape without changing the value', async () => {
    const user = userEvent.setup();
    render(<Harness initialValue="Michigan" />);

    await user.click(screen.getByRole('combobox', { name: 'Home Team' }));
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Home Team' })).toHaveValue('Michigan');
  });

  it('disables the input and hides the clear button when disabled', () => {
    render(<Harness disabled initialValue="Iowa" />);

    expect(screen.getByRole('combobox', { name: 'Home Team' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Clear Home Team' })).not.toBeInTheDocument();
  });

  it('filters options case-insensitively as the user types', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByRole('combobox', { name: 'Home Team' }), 'STATE');

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Ohio State');
  });

  it('hides excluded options', async () => {
    const user = userEvent.setup();
    render(<Harness excludedOptions={['Florida']} />);

    await user.click(screen.getByRole('combobox', { name: 'Home Team' }));

    expect(screen.queryByRole('option', { name: 'Florida' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(4);
  });

  it('selects an option on click and closes the list', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Harness onChange={handleChange} />);

    await user.click(screen.getByRole('combobox', { name: 'Home Team' }));
    await user.click(screen.getByRole('option', { name: 'Notre Dame' }));

    expect(handleChange).toHaveBeenCalledWith('Notre Dame');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Home Team' })).toHaveValue('Notre Dame');
  });

  it('selects the highlighted option with the arrow keys and Enter', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Harness onChange={handleChange} />);

    await user.click(screen.getByRole('combobox', { name: 'Home Team' }));
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowUp}{ArrowDown}{Enter}');

    expect(handleChange).toHaveBeenCalledWith('Michigan');
  });

  it('shows a no matches message when nothing matches', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByRole('combobox', { name: 'Home Team' }), 'zzz');

    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByText('No matches')).toBeInTheDocument();
  });

  it('shows every option when focused', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('combobox', { name: 'Home Team' }));

    expect(screen.getByRole('combobox', { name: 'Home Team' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('option')).toHaveLength(TEAMS.length);
  });
});
