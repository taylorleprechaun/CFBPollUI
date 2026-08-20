import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AlgorithmRunStatusBadge } from '../../../components/admin';

describe('AlgorithmRunStatusBadge', () => {
  it('renders the error status with a red badge', () => {
    render(<AlgorithmRunStatusBadge status="error" version="V1" />);

    const badge = screen.getByText('V1: Failed');
    expect(badge.className).toContain('bg-red-100');
  });

  it('renders the idle status with a gray badge', () => {
    render(<AlgorithmRunStatusBadge status="idle" version="V1" />);

    const badge = screen.getByText('V1: Idle');
    expect(badge.className).toContain('bg-gray-100');
  });

  it('renders the pending status with a blue badge', () => {
    render(<AlgorithmRunStatusBadge status="pending" version="V2" />);

    const badge = screen.getByText('V2: Running…');
    expect(badge.className).toContain('bg-blue-100');
  });

  it('renders the success status with a green badge', () => {
    render(<AlgorithmRunStatusBadge status="success" version="V2" />);

    const badge = screen.getByText('V2: Done');
    expect(badge.className).toContain('bg-green-100');
  });
});
