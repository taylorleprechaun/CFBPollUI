import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ChevronIcon } from '../../../components/ui/chevron-icon';

describe('ChevronIcon', () => {
  it('renders svg element', () => {
    const { container } = render(<ChevronIcon open={true} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('does not apply rotation when open', () => {
    const { container } = render(<ChevronIcon open={true} />);
    const svg = container.querySelector('svg')!;
    expect(svg.classList.toString()).not.toContain('-rotate-90');
  });

  it('applies -rotate-90 when closed', () => {
    const { container } = render(<ChevronIcon open={false} />);
    const svg = container.querySelector('svg')!;
    expect(svg.classList.toString()).toContain('-rotate-90');
  });

  it('uses default size w-5 h-5', () => {
    const { container } = render(<ChevronIcon open={true} />);
    const svg = container.querySelector('svg')!;
    expect(svg.classList.toString()).toContain('w-5');
    expect(svg.classList.toString()).toContain('h-5');
  });

  it('uses custom size when provided', () => {
    const { container } = render(<ChevronIcon open={true} size="w-4 h-4" />);
    const svg = container.querySelector('svg')!;
    expect(svg.classList.toString()).toContain('w-4');
    expect(svg.classList.toString()).toContain('h-4');
    expect(svg.classList.toString()).not.toContain('w-5');
  });
});
