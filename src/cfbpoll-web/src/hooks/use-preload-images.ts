import { useEffect, useRef } from 'react';

export function usePreloadImages(urls: string[]) {
  const preloadedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const url of urls) {
      if (preloadedRef.current.has(url)) continue;
      preloadedRef.current.add(url);
      const img = new Image();
      img.src = url;
    }
  }, [urls]);
}
