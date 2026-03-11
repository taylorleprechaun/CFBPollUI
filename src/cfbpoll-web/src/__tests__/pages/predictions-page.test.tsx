import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PredictionsPage } from '../../pages/predictions-page';

function renderPredictionsPage() {
  return render(
    <MemoryRouter>
      <PredictionsPage />
    </MemoryRouter>
  );
}

describe('PredictionsPage', () => {
  it('renders heading and placeholder text', () => {
    renderPredictionsPage();

    expect(screen.getByText('Predictions')).toBeInTheDocument();
    expect(screen.getByText('Coming soon.')).toBeInTheDocument();
  });
});
