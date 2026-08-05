import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInView } from '../../hooks/use-in-view';

const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
let mockCallback: IntersectionObserverCallback;

class MockIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    mockCallback = callback;
  }
  observe = mockObserve;
  disconnect = mockDisconnect;
  unobserve = vi.fn();
}

beforeEach(() => {
  mockObserve.mockClear();
  mockDisconnect.mockClear();

  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
});

function triggerIntersection(isIntersecting: boolean) {
  act(() => {
    mockCallback(
      [{ isIntersecting } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
  });
}

describe('useInView', () => {
  it('starts with inView false', () => {
    const { result } = renderHook(() => useInView());

    expect(result.current.inView).toBe(false);
  });

  it('becomes true on intersection', () => {
    const { result } = renderHook(() => useInView());
    const element = document.createElement('div');

    act(() => {
      result.current.ref(element);
    });
    triggerIntersection(true);

    expect(result.current.inView).toBe(true);
  });

  it('disconnects after first trigger when triggerOnce is true', () => {
    const { result } = renderHook(() => useInView({ triggerOnce: true }));
    const element = document.createElement('div');

    act(() => {
      result.current.ref(element);
    });
    triggerIntersection(true);

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('does not disconnect after trigger when triggerOnce is false', () => {
    const { result } = renderHook(() => useInView({ triggerOnce: false }));
    const element = document.createElement('div');

    act(() => {
      result.current.ref(element);
    });
    triggerIntersection(true);

    expect(mockDisconnect).not.toHaveBeenCalled();
  });

  it('resets inView to false when element leaves viewport with triggerOnce false', () => {
    const { result } = renderHook(() => useInView({ triggerOnce: false }));
    const element = document.createElement('div');

    act(() => {
      result.current.ref(element);
    });
    triggerIntersection(true);

    expect(result.current.inView).toBe(true);

    triggerIntersection(false);

    expect(result.current.inView).toBe(false);
  });

  it('cleans up observer on unmount', () => {
    const { result, unmount } = renderHook(() => useInView());
    const element = document.createElement('div');

    act(() => {
      result.current.ref(element);
    });

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('cleans up previous observer when ref is called with a new element', () => {
    const { result } = renderHook(() => useInView());
    const element1 = document.createElement('div');
    const element2 = document.createElement('div');

    act(() => {
      result.current.ref(element1);
    });

    expect(mockObserve).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.ref(element2);
    });

    expect(mockDisconnect).toHaveBeenCalled();
    expect(mockObserve).toHaveBeenCalledTimes(2);
  });

  it('does not create observer when ref is called with null', () => {
    const { result } = renderHook(() => useInView());

    act(() => {
      result.current.ref(null);
    });

    expect(mockObserve).not.toHaveBeenCalled();
  });
});
