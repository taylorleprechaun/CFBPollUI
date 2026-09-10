declare global {
  interface Window {
    kofiWidgetOverlay?: {
      draw: (username: string, options: Record<string, string>) => void;
    };
  }
}

const KOFI_DESKTOP_BREAKPOINT = 768; // matches Tailwind's `md` breakpoint used throughout layout.tsx
const KOFI_SCRIPT_SRC = 'https://storage.ko-fi.com/cdn/scripts/overlay-widget.js';

export function initKofiFloatingWidget(username: string) {
  if (!username) return;
  if (window.innerWidth < KOFI_DESKTOP_BREAKPOINT) return;

  const script = document.createElement('script');
  script.src = KOFI_SCRIPT_SRC;
  script.async = true;
  script.onload = () => {
    window.kofiWidgetOverlay?.draw(username, {
      type: 'floating-chat',
      'floating-chat.donateButton.text': 'Support me',
      'floating-chat.donateButton.background-color': '#72A5F2',
      'floating-chat.donateButton.text-color': '#fff',
    });
  };
  document.body.appendChild(script);
}
