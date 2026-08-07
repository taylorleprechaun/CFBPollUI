import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CollapsibleTrigger } from '../../../components/ui/collapsible-trigger';

describe('CollapsibleTrigger', () => {
  it('applies the provided className to the button', () => {
    render(
      <CollapsibleTrigger contentId="content-1" isOpen={true} onToggle={vi.fn()} className="custom-class">
        Section Title
      </CollapsibleTrigger>
    );

    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn();
    render(
      <CollapsibleTrigger contentId="content-1" isOpen={true} onToggle={onToggle} className="">
        Section Title
      </CollapsibleTrigger>
    );

    fireEvent.click(screen.getByRole('button'));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('renders its children inside the button', () => {
    render(
      <CollapsibleTrigger contentId="content-1" isOpen={true} onToggle={vi.fn()} className="">
        Section Title
      </CollapsibleTrigger>
    );

    expect(screen.getByRole('button', { name: /Section Title/ })).toBeInTheDocument();
  });

  it('rotates the chevron based on isOpen', () => {
    const { container, rerender } = render(
      <CollapsibleTrigger contentId="content-1" isOpen={true} onToggle={vi.fn()} className="">
        Section Title
      </CollapsibleTrigger>
    );

    expect(container.querySelector('svg')!.classList.toString()).not.toContain('-rotate-90');

    rerender(
      <CollapsibleTrigger contentId="content-1" isOpen={false} onToggle={vi.fn()} className="">
        Section Title
      </CollapsibleTrigger>
    );

    expect(container.querySelector('svg')!.classList.toString()).toContain('-rotate-90');
  });

  it('sets aria-controls to the given contentId', () => {
    render(
      <CollapsibleTrigger contentId="content-1" isOpen={true} onToggle={vi.fn()} className="">
        Section Title
      </CollapsibleTrigger>
    );

    expect(screen.getByRole('button')).toHaveAttribute('aria-controls', 'content-1');
  });

  it('sets aria-expanded to match isOpen', () => {
    const { rerender } = render(
      <CollapsibleTrigger contentId="content-1" isOpen={true} onToggle={vi.fn()} className="">
        Section Title
      </CollapsibleTrigger>
    );

    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');

    rerender(
      <CollapsibleTrigger contentId="content-1" isOpen={false} onToggle={vi.fn()} className="">
        Section Title
      </CollapsibleTrigger>
    );

    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  });
});
