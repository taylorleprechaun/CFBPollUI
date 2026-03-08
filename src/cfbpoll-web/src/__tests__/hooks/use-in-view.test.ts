import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInView } from '../../hooks/use-in-view';

var mockObserve = vi.fn();
var mockDisconnect = vi.fn();
var mockCallback: IntersectionObserverCallback;

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
    var { result } = renderHook(() => useInView());

    expect(result.current.inView).toBe(false);
  });

  it('becomes true on intersection', () => {
    var { result } = renderHook(() => useInView());
    var element = document.createElement('div');

    act(() => {
      result.current.ref(element);
    });
    triggerIntersection(true);

    expect(result.current.inView).toBe(true);
  });

  it('disconnects after first trigger when triggerOnce is true', () => {
    var { result } = renderHook(() => useInView({ triggerOnce: true }));
    var element = document.createElement('div');

    act(() => {
      result.current.ref(element);
    });
    triggerIntersection(true);

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('does not disconnect after trigger when triggerOnce is false', () => {
    var { result } = renderHook(() => useInView({ triggerOnce: false }));
    var element = document.createElement('div');

    act(() => {
      result.current.ref(element);
    });
    triggerIntersection(true);

    expect(mockDisconnect).not.toHaveBeenCalled();
  });

  it('resets inView to false when element leaves viewport with triggerOnce false', () => {
    var { result } = renderHook(() => useInView({ triggerOnce: false }));
    var element = document.createElement('div');

    act(() => {
      result.current.ref(element);
    });
    triggerIntersection(true);

    expect(result.current.inView).toBe(true);

    triggerIntersection(false);

    expect(result.current.inView).toBe(false);
  });

  it('cleans up observer on unmount', () => {
    var { result, unmount } = renderHook(() => useInView());
    var element = document.createElement('div');

    act(() => {
      result.current.ref(element);
    });

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('cleans up previous observer when ref is called with a new element', () => {
    var { result } = renderHook(() => useInView());
    var element1 = document.createElement('div');
    var element2 = document.createElement('div');

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
    var { result } = renderHook(() => useInView());

    act(() => {
      result.current.ref(null);
    });

    expect(mockObserve).not.toHaveBeenCalled();
  });
});
