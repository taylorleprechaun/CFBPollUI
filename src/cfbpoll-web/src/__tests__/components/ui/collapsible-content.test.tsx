import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CollapsibleContent } from '../../../components/ui/collapsible-content';

describe('CollapsibleContent', () => {
  it('renders children and applies the given id', () => {
    const { container, getByText } = render(
      <CollapsibleContent id="content-1" isOpen={true}>
        <p>Body content</p>
      </CollapsibleContent>
    );

    expect(getByText('Body content')).toBeInTheDocument();
    expect(container.querySelector('#content-1')).toBeInTheDocument();
  });

  it('sets gridTemplateRows to 1fr when open', () => {
    const { container } = render(
      <CollapsibleContent id="content-1" isOpen={true}>
        <p>Body content</p>
      </CollapsibleContent>
    );

    expect(container.querySelector('#content-1')).toHaveStyle({ gridTemplateRows: '1fr' });
  });

  it('sets gridTemplateRows to 0fr when closed', () => {
    const { container } = render(
      <CollapsibleContent id="content-1" isOpen={false}>
        <p>Body content</p>
      </CollapsibleContent>
    );

    expect(container.querySelector('#content-1')).toHaveStyle({ gridTemplateRows: '0fr' });
  });
});
