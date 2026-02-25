import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePreloadImages } from '../../hooks/use-preload-images';

describe('usePreloadImages', () => {
  let imageSrcs: string[];

  beforeEach(() => {
    imageSrcs = [];
    vi.stubGlobal('Image', class MockImage {
      set src(value: string) {
        imageSrcs.push(value);
      }
    });
  });

  it('preloads each unique URL once', () => {
    const urls = ['https://example.com/a.png', 'https://example.com/b.png'];

    renderHook(() => usePreloadImages(urls));

    expect(imageSrcs).toEqual(['https://example.com/a.png', 'https://example.com/b.png']);
  });

  it('does not re-preload on rerender with same URLs', () => {
    const urls = ['https://example.com/a.png'];

    const { rerender } = renderHook(({ u }) => usePreloadImages(u), {
      initialProps: { u: urls },
    });

    expect(imageSrcs).toHaveLength(1);

    rerender({ u: urls });

    expect(imageSrcs).toHaveLength(1);
  });

  it('handles empty array', () => {
    renderHook(() => usePreloadImages([]));

    expect(imageSrcs).toHaveLength(0);
  });

  it('preloads new URLs when data changes', () => {
    const initialUrls = ['https://example.com/a.png'];
    const updatedUrls = ['https://example.com/a.png', 'https://example.com/b.png'];

    const { rerender } = renderHook(({ u }) => usePreloadImages(u), {
      initialProps: { u: initialUrls },
    });

    expect(imageSrcs).toEqual(['https://example.com/a.png']);

    rerender({ u: updatedUrls });

    expect(imageSrcs).toEqual(['https://example.com/a.png', 'https://example.com/b.png']);
  });
});
