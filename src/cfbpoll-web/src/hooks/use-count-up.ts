import { useEffect, useRef, useState } from 'react';

interface UseCountUpOptions {
  duration?: number;
  enabled?: boolean;
  end: number;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function useCountUp({
  end,
  duration = 1500,
  enabled = true,
}: UseCountUpOptions): number {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number | null>(null);
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!enabled) {
      setCurrent(0);
      return;
    }

    if (prefersReducedMotion) {
      setCurrent(end);
      return;
    }

    var startTime: number | null = null;

    function animate(timestamp: number) {
      if (startTime === null) startTime = timestamp;
      var elapsed = timestamp - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var easedProgress = easeOutCubic(progress);

      setCurrent(Math.round(easedProgress * end));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [end, duration, enabled, prefersReducedMotion]);

  return current;
}
