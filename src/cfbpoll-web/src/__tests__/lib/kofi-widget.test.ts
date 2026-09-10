import { afterEach, describe, expect, it, vi } from 'vitest';

import { initKofiFloatingWidget } from '../../lib/kofi-widget';

const KOFI_SCRIPT_SELECTOR = 'script[src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js"]';

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width, writable: true });
}

afterEach(() => {
  delete window.kofiWidgetOverlay;
  document.querySelectorAll(KOFI_SCRIPT_SELECTOR).forEach((el) => el.remove());
});

describe('initKofiFloatingWidget', () => {
  it('does nothing on a mobile-width viewport even when a username is given', () => {
    setViewportWidth(500);

    initKofiFloatingWidget('testowner');

    expect(document.querySelector(KOFI_SCRIPT_SELECTOR)).not.toBeInTheDocument();
  });

  it('does nothing when the username is empty', () => {
    setViewportWidth(1024);

    initKofiFloatingWidget('');

    expect(document.querySelector(KOFI_SCRIPT_SELECTOR)).not.toBeInTheDocument();
  });

  it('injects the script and draws the widget with the given username on a desktop-width viewport', () => {
    setViewportWidth(1024);
    const drawMock = vi.fn();

    initKofiFloatingWidget('testowner');

    const script = document.querySelector(KOFI_SCRIPT_SELECTOR);
    expect(script).toBeInTheDocument();

    window.kofiWidgetOverlay = { draw: drawMock };
    script?.dispatchEvent(new Event('load'));

    expect(drawMock).toHaveBeenCalledWith('testowner', expect.objectContaining({ type: 'floating-chat' }));
  });
});
