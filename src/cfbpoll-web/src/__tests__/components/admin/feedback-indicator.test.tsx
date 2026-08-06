import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FeedbackIndicator } from '../../../components/admin/feedback-indicator';

describe('FeedbackIndicator', () => {
  it('renders nothing when feedback is null', () => {
    const { container } = render(
      <FeedbackIndicator feedback={null} feedbackKey="action-2024-5" onClear={vi.fn()} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the feedback key does not match', () => {
    const { container } = render(
      <FeedbackIndicator
        feedback={{ key: 'action-2023-1', type: 'success' }}
        feedbackKey="action-2024-5"
        onClear={vi.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders a success checkmark for a matching success key', () => {
    render(
      <FeedbackIndicator
        feedback={{ key: 'action-2024-5', type: 'success' }}
        feedbackKey="action-2024-5"
        onClear={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Success')).toBeInTheDocument();
  });

  it('announces success feedback to screen readers via a status live region', () => {
    render(
      <FeedbackIndicator
        feedback={{ key: 'action-2024-5', type: 'success', message: 'Published' }}
        feedbackKey="action-2024-5"
        onClear={vi.fn()}
      />
    );

    expect(screen.getByRole('status')).toHaveTextContent('Published');
  });

  it('announces error feedback to screen readers via an alert live region', () => {
    render(
      <FeedbackIndicator
        feedback={{ key: 'action-2024-5', type: 'error', message: 'Publish failed' }}
        feedbackKey="action-2024-5"
        onClear={vi.fn()}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Publish failed');
  });

  it('renders the success message when provided', () => {
    render(
      <FeedbackIndicator
        feedback={{ key: 'action-2024-5', type: 'success', message: 'Removed 4 cached entries' }}
        feedbackKey="action-2024-5"
        onClear={vi.fn()}
      />
    );

    expect(screen.getByText('Removed 4 cached entries')).toBeInTheDocument();
  });

  it('renders the error message for a matching error key', () => {
    render(
      <FeedbackIndicator
        feedback={{ key: 'action-2024-5', type: 'error', message: 'Publish failed' }}
        feedbackKey="action-2024-5"
        onClear={vi.fn()}
      />
    );

    expect(screen.getByText('Publish failed')).toBeInTheDocument();
  });
});
