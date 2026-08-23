import { describe, expect, it } from 'vitest';

import { formatBytes } from '../../lib/format-bytes';

describe('formatBytes', () => {
  it('formats bytes below 1024 with a B suffix', () => {
    expect(formatBytes(512)).toBe('512 B');
  });

  it('formats gigabyte values with a GB suffix', () => {
    expect(formatBytes(1024 * 1024 * 1024 * 2.5)).toBe('2.5 GB');
  });

  it('formats kilobyte values with a KB suffix', () => {
    expect(formatBytes(2048)).toBe('2.0 KB');
  });

  it('formats megabyte values with an MB suffix', () => {
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
  });

  it('formats zero bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
  });
});
