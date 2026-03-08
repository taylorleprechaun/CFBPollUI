import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountUp } from '../../hooks/use-count-up';

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useCountUp', () => {
  it('returns 0 when enabled is false', () => {
    var { result } = renderHook(() =>
      useCountUp({ end: 100, enabled: false }),
    );

    expect(result.current).toBe(0);
  });

  it('returns end value immediately when prefers-reduced-motion is set', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));

    var { result } = renderHook(() =>
      useCountUp({ end: 42, enabled: true }),
    );

    expect(result.current).toBe(42);
  });

  it('reaches end value after animation completes', () => {
    var rafCallbacks: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    var { result } = renderHook(() =>
      useCountUp({ end: 100, duration: 1000, enabled: true }),
    );

    // Simulate animation start
    act(() => {
      if (rafCallbacks.length > 0) rafCallbacks[rafCallbacks.length - 1](0);
    });

    // Simulate animation end (past duration)
    act(() => {
      if (rafCallbacks.length > 0) rafCallbacks[rafCallbacks.length - 1](1500);
    });

    expect(result.current).toBe(100);
  });

  it('cancels animation frame on cleanup', () => {
    var mockCancel = vi.fn();
    vi.stubGlobal('requestAnimationFrame', vi.fn().mockReturnValue(42));
    vi.stubGlobal('cancelAnimationFrame', mockCancel);

    var { unmount } = renderHook(() =>
      useCountUp({ end: 100, enabled: true }),
    );

    unmount();

    expect(mockCancel).toHaveBeenCalledWith(42);
  });

  it('resets to 0 when enabled changes from true to false', () => {
    vi.stubGlobal('requestAnimationFrame', vi.fn().mockReturnValue(1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    var { result, rerender } = renderHook(
      ({ enabled }) => useCountUp({ end: 100, enabled }),
      { initialProps: { enabled: true } },
    );

    rerender({ enabled: false });

    expect(result.current).toBe(0);
  });
});
