import '@testing-library/jest-dom';
import { afterEach } from 'vitest';

// Tests must mock every request. A real fetch only passes while no local API is running, and the services
// catch the network error, so record each one here and fail the test that made it.
const unmockedFetches: string[] = [];

globalThis.fetch = ((input: RequestInfo | URL) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  unmockedFetches.push(url);
  return Promise.reject(new Error(`Unmocked fetch in test: ${url}`));
}) as typeof fetch;

afterEach(() => {
  if (unmockedFetches.length === 0) return;

  const urls = unmockedFetches.splice(0);
  throw new Error(`Unmocked fetch in test: ${urls.join(', ')}`);
});

window.scrollTo = () => {};

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
