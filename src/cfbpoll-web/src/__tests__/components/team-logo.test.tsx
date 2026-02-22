import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TeamLogo } from '../../components/rankings/team-logo';

describe('TeamLogo', () => {
  it('renders image when logoURL is provided', () => {
    render(<TeamLogo logoURL="https://example.com/logo.png" teamName="USC" />);

    const img = screen.getByAltText('USC logo');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/logo.png');
  });

  it('renders fallback with first letter when logoURL is empty', () => {
    render(<TeamLogo logoURL="" teamName="USC" />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('U')).toBeInTheDocument();
  });

  it('renders fallback with first letter when image fails to load', () => {
    render(<TeamLogo logoURL="https://example.com/invalid.png" teamName="Michigan" />);

    const img = screen.getByAltText('Michigan logo');
    fireEvent.error(img);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
  });

  it('applies correct CSS classes to image', () => {
    render(<TeamLogo logoURL="https://example.com/logo.png" teamName="Ohio State" />);

    const img = screen.getByAltText('Ohio State logo');
    expect(img).toHaveClass('w-8', 'h-8', 'object-contain');
  });

  it('applies correct CSS classes to fallback', () => {
    render(<TeamLogo logoURL="" teamName="Texas" />);

    const fallback = screen.getByText('T');
    expect(fallback).toHaveClass('w-8', 'h-8', 'bg-gray-200', 'rounded-full');
  });
});
