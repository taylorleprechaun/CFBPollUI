import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SettingsPage } from '../../pages/settings-page';

const mockLogout = vi.fn();
let mockToken: string | null = 'test-token';

vi.mock('../../contexts/auth-context', () => ({
  useAuth: () => ({
    isAuthenticated: mockToken !== null,
    login: vi.fn(),
    logout: mockLogout,
    token: mockToken,
  }),
}));

let mockAllTimeEnabled = true;
let mockPollLeadersEnabled = true;
let mockSeasonTrendsEnabled = true;

vi.mock('../../hooks/use-page-visibility', () => ({
  usePageVisibility: () => ({
    allTimeEnabled: mockAllTimeEnabled,
    isLoading: false,
    pollLeadersEnabled: mockPollLeadersEnabled,
    seasonTrendsEnabled: mockSeasonTrendsEnabled,
  }),
}));

const mockUpdatePageVisibility = vi.fn();

vi.mock('../../services/admin-api', () => ({
  updatePageVisibility: (...args: unknown[]) => mockUpdatePageVisibility(...args),
}));

function renderSettingsPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToken = 'test-token';
    mockAllTimeEnabled = true;
    mockPollLeadersEnabled = true;
    mockSeasonTrendsEnabled = true;
  });

  it('renders settings page heading and logout button', () => {
    renderSettingsPage();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Log Out')).toBeInTheDocument();
  });

  it('calls logout when Log Out is clicked', async () => {
    renderSettingsPage();
    await userEvent.click(screen.getByText('Log Out'));
    expect(mockLogout).toHaveBeenCalled();
  });

  it('renders page visibility toggles grouped by nav section', () => {
    renderSettingsPage();

    expect(screen.getByText('Page Visibility')).toBeInTheDocument();
    expect(screen.getByText('Rankings')).toBeInTheDocument();
    expect(screen.getByText('Season Trends')).toBeInTheDocument();
    expect(screen.getByText('All-Time')).toBeInTheDocument();
    expect(screen.getByText('All-Time Rankings')).toBeInTheDocument();
    expect(screen.getByText('Poll Leaders')).toBeInTheDocument();
  });

  it('renders page visibility toggles with correct checked state', () => {
    mockAllTimeEnabled = true;
    mockPollLeadersEnabled = false;

    renderSettingsPage();

    const allTimeToggle = screen.getByLabelText('All-Time Rankings');
    const pollLeadersToggle = screen.getByLabelText('Poll Leaders');

    expect(allTimeToggle).toHaveAttribute('aria-checked', 'true');
    expect(pollLeadersToggle).toHaveAttribute('aria-checked', 'false');
  });

  it('calls updatePageVisibility when toggle is changed', async () => {
    mockAllTimeEnabled = true;
    mockPollLeadersEnabled = true;
    mockSeasonTrendsEnabled = true;
    mockUpdatePageVisibility.mockResolvedValue({
      allTimeEnabled: false,
      pollLeadersEnabled: true,
      seasonTrendsEnabled: true,
    });

    renderSettingsPage();

    const allTimeCheckbox = screen.getByLabelText('All-Time Rankings');
    await userEvent.click(allTimeCheckbox);

    await waitFor(() => {
      expect(mockUpdatePageVisibility).toHaveBeenCalledWith(
        'test-token',
        { allTimeEnabled: false, pollLeadersEnabled: true, seasonTrendsEnabled: true }
      );
    });
  });

  it('shows success feedback after visibility update', async () => {
    mockUpdatePageVisibility.mockResolvedValue({
      allTimeEnabled: false,
      pollLeadersEnabled: true,
    });

    renderSettingsPage();

    await userEvent.click(screen.getByLabelText('All-Time Rankings'));

    await waitFor(() => {
      expect(screen.getByText('Page visibility updated')).toBeInTheDocument();
    });
  });

  it('renders season trends toggle with correct checked state', () => {
    mockSeasonTrendsEnabled = false;

    renderSettingsPage();

    const seasonTrendsToggle = screen.getByLabelText('Season Trends');
    expect(seasonTrendsToggle).toHaveAttribute('aria-checked', 'false');
  });

  it('calls updatePageVisibility when season trends toggle is changed', async () => {
    mockSeasonTrendsEnabled = true;
    mockUpdatePageVisibility.mockResolvedValue({
      allTimeEnabled: true,
      pollLeadersEnabled: true,
      seasonTrendsEnabled: false,
    });

    renderSettingsPage();

    const seasonTrendsToggle = screen.getByLabelText('Season Trends');
    await userEvent.click(seasonTrendsToggle);

    await waitFor(() => {
      expect(mockUpdatePageVisibility).toHaveBeenCalledWith(
        'test-token',
        { allTimeEnabled: true, pollLeadersEnabled: true, seasonTrendsEnabled: false }
      );
    });
  });

  it('shows error feedback when visibility update fails', async () => {
    mockUpdatePageVisibility.mockRejectedValue(new Error('Update failed'));

    renderSettingsPage();

    await userEvent.click(screen.getByLabelText('Poll Leaders'));

    await waitFor(() => {
      expect(screen.getByText('Failed to update page visibility')).toBeInTheDocument();
    });
  });
});
