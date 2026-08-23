import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CfbdUsageSection } from '../../../components/admin';

const mockRefresh = vi.fn();
let mockData: unknown = undefined;
let mockIsLoading = false;
let mockIsRefreshing = false;

vi.mock('../../../hooks/use-cfbd-usage', () => ({
  useCfbdUsage: () => ({
    data: mockData,
    isLoading: mockIsLoading,
    isRefreshing: mockIsRefreshing,
    refresh: mockRefresh,
  }),
}));

const usage = {
  monthlyLimit: 1000,
  remainingCalls: 900,
  resetAt: '2026-09-01T00:00:00Z',
  tierName: 'Patron',
  topEndpoints: [{ endpoint: '/games', requestCount: 42 }],
  totalRequestsInWindow: 100,
  usedCalls: 100,
};

describe('CfbdUsageSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockData = undefined;
    mockIsLoading = false;
    mockIsRefreshing = false;
  });

  it('calls refresh when the refresh button is clicked', async () => {
    mockData = usage;
    render(<CfbdUsageSection token="test-token" />);

    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));

    expect(mockRefresh).toHaveBeenCalled();
  });

  it('disables the refresh button while refreshing', () => {
    mockData = usage;
    mockIsRefreshing = true;
    render(<CfbdUsageSection token="test-token" />);

    expect(screen.getByText('Refreshing...')).toBeDisabled();
  });

  it('renders quota and tier data', () => {
    mockData = usage;
    render(<CfbdUsageSection token="test-token" />);

    expect(screen.getByText('900')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('1,000')).toBeInTheDocument();
    expect(screen.getByText('Patron')).toBeInTheDocument();
  });

  it('renders the top endpoints list', () => {
    mockData = usage;
    render(<CfbdUsageSection token="test-token" />);

    expect(screen.getByText('/games')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('shows a loading indicator while data is loading', () => {
    mockIsLoading = true;
    render(<CfbdUsageSection token="test-token" />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
