import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MoonIcon, SunIcon } from '../../../../components/ui/icons/theme-icon';

describe('SunIcon', () => {
  it('renders an svg element', () => {
    const { container } = render(<SunIcon />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});

describe('MoonIcon', () => {
  it('renders an svg element', () => {
    const { container } = render(<MoonIcon />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
