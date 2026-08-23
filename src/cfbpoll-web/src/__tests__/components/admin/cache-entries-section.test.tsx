import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { CacheEntry } from '../../../schemas/admin';

import { CacheEntriesSection } from '../../../components/admin';
import { groupCacheEntriesByFamily } from '../../../lib/group-cache-entries';

const teamsEntry: CacheEntry = {
  cachedAt: '2026-08-01T00:00:00Z',
  cacheKey: 'teams_2024',
  detail: '',
  expiresAt: '9999-12-31T23:59:59.9999999Z',
  family: 'Teams',
  season: 2024,
  sizeBytes: 100,
};

const conferencesEntry: CacheEntry = {
  cachedAt: '2026-08-01T00:00:00Z',
  cacheKey: 'conferences',
  detail: '',
  expiresAt: '2026-08-24T18:12:39.2305476Z',
  family: 'Conferences',
  season: null,
  sizeBytes: 50,
};

function renderSection(overrides: Partial<Parameters<typeof CacheEntriesSection>[0]> = {}) {
  const groups = groupCacheEntriesByFamily([teamsEntry, conferencesEntry]);

  return render(
    <CacheEntriesSection
      expandedFamilies={new Set(['Teams', 'Conferences'])}
      groups={groups}
      isDeleting={false}
      isLoading={false}
      onDeleteOne={vi.fn()}
      onToggleFamily={vi.fn()}
      onToggleSelect={vi.fn()}
      onToggleSelectFamily={vi.fn()}
      selectedKeys={new Set()}
      {...overrides}
    />
  );
}

describe('CacheEntriesSection', () => {
  it('calls onDeleteOne with the cache key when a row delete button is clicked', async () => {
    const onDeleteOne = vi.fn();
    renderSection({ onDeleteOne });

    const row = screen.getByLabelText('Select teams_2024').closest('tr')!;
    await userEvent.click(within(row).getByRole('button', { name: 'Delete' }));

    expect(onDeleteOne).toHaveBeenCalledWith('teams_2024');
  });

  it('calls onToggleFamily with the family name when the header is clicked', async () => {
    const onToggleFamily = vi.fn();
    renderSection({ onToggleFamily });

    await userEvent.click(screen.getByRole('button', { name: /Teams/ }));

    expect(onToggleFamily).toHaveBeenCalledWith('Teams');
  });

  it('calls onToggleSelect when a row checkbox is clicked', async () => {
    const onToggleSelect = vi.fn();
    renderSection({ onToggleSelect });

    await userEvent.click(screen.getByLabelText('Select teams_2024'));

    expect(onToggleSelect).toHaveBeenCalledWith('teams_2024');
  });

  it('calls onToggleSelectFamily with all keys in the family when the header checkbox is clicked', async () => {
    const onToggleSelectFamily = vi.fn();
    renderSection({ onToggleSelectFamily });

    await userEvent.click(screen.getByLabelText('Select all Teams entries'));

    expect(onToggleSelectFamily).toHaveBeenCalledWith('Teams', ['teams_2024']);
  });

  it('checks the row checkbox for keys in selectedKeys', () => {
    renderSection({ selectedKeys: new Set(['teams_2024']) });

    expect(screen.getByLabelText('Select teams_2024')).toBeChecked();
  });

  it('renders "1 entry" (singular) when a family has exactly one entry', () => {
    renderSection();

    expect(screen.getAllByText(/1 entry,/)).toHaveLength(2);
  });

  it('renders "Never" for entries with the 9999 sentinel expiration', () => {
    renderSection();

    expect(screen.getByText('Never')).toBeInTheDocument();
  });

  it('renders a family group per unique family, sorted alphabetically', () => {
    renderSection();

    expect(screen.getByText('Conferences')).toBeInTheDocument();
    expect(screen.getByText('Teams')).toBeInTheDocument();
  });

  it('renders a loading skeleton instead of groups', () => {
    renderSection({ isLoading: true });

    expect(screen.queryByText('Teams')).not.toBeInTheDocument();
    expect(screen.queryByText('No cached entries found.')).not.toBeInTheDocument();
  });

  it('renders an empty state when there are no groups', () => {
    render(
      <CacheEntriesSection
        expandedFamilies={new Set()}
        groups={[]}
        isDeleting={false}
        isLoading={false}
        onDeleteOne={vi.fn()}
        onToggleFamily={vi.fn()}
        onToggleSelect={vi.fn()}
        onToggleSelectFamily={vi.fn()}
        selectedKeys={new Set()}
      />
    );

    expect(screen.getByText('No cached entries found.')).toBeInTheDocument();
  });

  it('renders each family collapsed when it is not in expandedFamilies', () => {
    renderSection({ expandedFamilies: new Set() });

    const trigger = screen.getByRole('button', { name: /Teams/ });

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders the detail suffix when an entry has one', () => {
    const groups = groupCacheEntriesByFamily([{ ...teamsEntry, detail: 'Regular' }]);
    render(
      <CacheEntriesSection
        expandedFamilies={new Set(['Teams'])}
        groups={groups}
        isDeleting={false}
        isLoading={false}
        onDeleteOne={vi.fn()}
        onToggleFamily={vi.fn()}
        onToggleSelect={vi.fn()}
        onToggleSelectFamily={vi.fn()}
        selectedKeys={new Set()}
      />
    );

    expect(screen.getByText('· Regular')).toBeInTheDocument();
  });
});
