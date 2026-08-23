import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CachePage } from '../../pages/cache-page';

const mockToken = 'test-token';

vi.mock('../../hooks/use-auth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
    token: mockToken,
  }),
}));

const mockDeleteOne = vi.fn();
const mockDeleteMany = vi.fn();
let mockData: unknown[] = [];
let mockIsLoading = false;

vi.mock('../../hooks/use-cache-entries', () => ({
  useCacheEntries: () => ({
    data: mockData,
    deleteMany: mockDeleteMany,
    deleteOne: mockDeleteOne,
    isDeleting: false,
    isLoading: mockIsLoading,
  }),
}));

const teamsEntry = {
  cachedAt: '2026-08-01T00:00:00Z',
  cacheKey: 'teams_2024',
  detail: '',
  expiresAt: '9999-12-31T23:59:59.9999999Z',
  family: 'Teams',
  season: 2024,
  sizeBytes: 100,
};

const conferencesEntry = {
  cachedAt: '2026-08-01T00:00:00Z',
  cacheKey: 'conferences',
  detail: '',
  expiresAt: '2026-08-24T18:12:39.2305476Z',
  family: 'Conferences',
  season: null,
  sizeBytes: 50,
};

describe('CachePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockData = [teamsEntry, conferencesEntry];
    mockIsLoading = false;
  });

  it('calls deleteMany with the selected keys when bulk delete is confirmed', async () => {
    render(<CachePage />);

    await userEvent.click(screen.getByLabelText('Select teams_2024'));
    await userEvent.click(screen.getByRole('button', { name: 'Delete Selected' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));

    expect(mockDeleteMany).toHaveBeenCalledWith(['teams_2024']);
  });

  it('calls deleteOne with the cache key when a single-row delete is confirmed', async () => {
    render(<CachePage />);

    const row = screen.getByLabelText('Select teams_2024').closest('tr')!;
    await userEvent.click(within(row).getByRole('button', { name: 'Delete' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));

    expect(mockDeleteOne).toHaveBeenCalledWith('teams_2024');
  });

  it('checks a row checkbox, then unchecks it on a second click', async () => {
    render(<CachePage />);

    const checkbox = screen.getByLabelText('Select teams_2024');
    await userEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    await userEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('checks the family select-all checkbox, then unchecks it on a second click', async () => {
    render(<CachePage />);

    await userEvent.click(screen.getByLabelText('Select all Teams entries'));
    expect(screen.getByLabelText('Select teams_2024')).toBeChecked();

    await userEvent.click(screen.getByLabelText('Select all Teams entries'));
    expect(screen.getByLabelText('Select teams_2024')).not.toBeChecked();
  });

  it('clears the selection when Clear Selection is clicked', async () => {
    render(<CachePage />);

    await userEvent.click(screen.getByLabelText('Select teams_2024'));
    expect(screen.getByText('1 selected')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Clear Selection' }));

    expect(screen.queryByText('1 selected')).not.toBeInTheDocument();
  });

  it('closes the confirmation modal without deleting when cancelled', async () => {
    render(<CachePage />);

    const row = screen.getByLabelText('Select teams_2024').closest('tr')!;
    await userEvent.click(within(row).getByRole('button', { name: 'Delete' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mockDeleteOne).not.toHaveBeenCalled();
  });

  it('does not show the selection bar when nothing is selected', () => {
    render(<CachePage />);

    expect(screen.queryByRole('button', { name: 'Delete Selected' })).not.toBeInTheDocument();
  });

  it('expands and collapses a family when its header is clicked', async () => {
    render(<CachePage />);

    const trigger = screen.getByRole('button', { name: /Teams/ });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders no groups when data is undefined', () => {
    mockData = undefined as unknown as [];

    render(<CachePage />);

    expect(screen.getByText('No cached entries found.')).toBeInTheDocument();
  });

  it('renders the page heading', () => {
    render(<CachePage />);

    expect(screen.getByRole('heading', { name: 'Cache' })).toBeInTheDocument();
  });

  it('shows the selected count when an entry is checked', async () => {
    render(<CachePage />);

    await userEvent.click(screen.getByLabelText('Select teams_2024'));

    expect(screen.getByText('1 selected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete Selected' })).toBeInTheDocument();
  });
});
