import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { InfoIcon } from '../../../../components/ui/icons/info-icon';

describe('InfoIcon', () => {
  it('renders an svg element', () => {
    const { container } = render(<InfoIcon />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
