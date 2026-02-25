import { describe, it, expect } from 'vitest';
import { collectLogoUrls } from '../../lib/logo-utils';

describe('collectLogoUrls', () => {
  it('returns empty array when called with no arguments', () => {
    expect(collectLogoUrls()).toEqual([]);
  });

  it('returns empty array for an empty array input', () => {
    expect(collectLogoUrls([])).toEqual([]);
  });

  it('collects URLs from a single array', () => {
    const items = [
      { logoURL: 'https://example.com/a.png' },
      { logoURL: 'https://example.com/b.png' },
    ];
    expect(collectLogoUrls(items)).toEqual([
      'https://example.com/a.png',
      'https://example.com/b.png',
    ]);
  });

  it('deduplicates URLs within a single array', () => {
    const items = [
      { logoURL: 'https://example.com/a.png' },
      { logoURL: 'https://example.com/a.png' },
      { logoURL: 'https://example.com/b.png' },
    ];
    expect(collectLogoUrls(items)).toEqual([
      'https://example.com/a.png',
      'https://example.com/b.png',
    ]);
  });

  it('deduplicates URLs across multiple arrays', () => {
    const first = [{ logoURL: 'https://example.com/a.png' }];
    const second = [
      { logoURL: 'https://example.com/a.png' },
      { logoURL: 'https://example.com/b.png' },
    ];
    expect(collectLogoUrls(first, second)).toEqual([
      'https://example.com/a.png',
      'https://example.com/b.png',
    ]);
  });

  it('collects URLs from three arrays', () => {
    const first = [{ logoURL: 'https://example.com/a.png' }];
    const second = [{ logoURL: 'https://example.com/b.png' }];
    const third = [{ logoURL: 'https://example.com/c.png' }];
    expect(collectLogoUrls(first, second, third)).toEqual([
      'https://example.com/a.png',
      'https://example.com/b.png',
      'https://example.com/c.png',
    ]);
  });

  it('ignores extra properties on items', () => {
    const items = [
      { logoURL: 'https://example.com/a.png', name: 'Team A', rank: 1 },
      { logoURL: 'https://example.com/b.png', name: 'Team B', rank: 2 },
    ];
    expect(collectLogoUrls(items)).toEqual([
      'https://example.com/a.png',
      'https://example.com/b.png',
    ]);
  });
});
