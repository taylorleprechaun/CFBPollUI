import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RequirePageEnabled } from '../../../components/auth/require-page-enabled';

let mockIsLoading = false;

vi.mock('../../../hooks/use-page-visibility', () => ({
  usePageVisibility: () => ({
    allTimeEnabled: true,
    isLoading: mockIsLoading,
    pollLeadersEnabled: true,
  }),
}));

function renderWithRouter(enabled: boolean) {
  return render(
    <MemoryRouter initialEntries={['/test']}>
      <Routes>
        <Route path="/test" element={
          <RequirePageEnabled enabled={enabled}>
            <div>Protected Content</div>
          </RequirePageEnabled>
        } />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('RequirePageEnabled', () => {
  it('renders children when enabled is true', () => {
    mockIsLoading = false;
    renderWithRouter(true);

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to / when enabled is false', () => {
    mockIsLoading = false;
    renderWithRouter(false);

    expect(screen.getByText('Home Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('shows loading fallback while isLoading is true', () => {
    mockIsLoading = true;
    renderWithRouter(true);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('shows loading fallback when isLoading is true and enabled is false', () => {
    mockIsLoading = true;
    renderWithRouter(false);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.queryByText('Home Page')).not.toBeInTheDocument();
  });
});
