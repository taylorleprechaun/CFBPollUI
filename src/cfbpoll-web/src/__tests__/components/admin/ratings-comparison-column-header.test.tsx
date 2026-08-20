import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RatingsComparisonColumnHeader } from '../../../components/admin';

const mockExportMutateAsync = vi.fn();
let mockExportIsPending = false;

vi.mock('../../../hooks/use-experimental-mutations', () => ({
  useExportExperimental: () => ({
    mutateAsync: mockExportMutateAsync,
    isPending: mockExportIsPending,
  }),
}));

describe('RatingsComparisonColumnHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExportIsPending = false;
  });

  it('calls the export mutation with the column algorithm version, season, and week on click', async () => {
    mockExportMutateAsync.mockResolvedValue(undefined);
    render(<RatingsComparisonColumnHeader algorithmVersion="V2" season={2024} token="test-token" week={5} />);

    await userEvent.click(screen.getByText('Download Excel'));

    await waitFor(() => {
      expect(mockExportMutateAsync).toHaveBeenCalledWith({ algorithmVersion: 'V2', season: 2024, week: 5 });
    });
  });

  it('disables the export button while exporting', () => {
    mockExportIsPending = true;
    render(<RatingsComparisonColumnHeader algorithmVersion="V1" season={2024} token="test-token" week={5} />);

    expect(screen.getByText('Exporting...')).toBeDisabled();
  });

  it('renders the algorithm version label', () => {
    render(<RatingsComparisonColumnHeader algorithmVersion="V1" season={2024} token="test-token" week={5} />);

    expect(screen.getByText('V1')).toBeInTheDocument();
  });

  it('shows an error alert isolated to this column when export fails', async () => {
    mockExportMutateAsync.mockRejectedValue(new Error('Export failed'));
    render(<RatingsComparisonColumnHeader algorithmVersion="V1" season={2024} token="test-token" week={5} />);

    await userEvent.click(screen.getByText('Download Excel'));

    await waitFor(() => {
      expect(screen.getByText('Export failed')).toBeInTheDocument();
    });
  });
});
