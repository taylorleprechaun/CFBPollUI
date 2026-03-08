import { useCallback, useEffect, useRef, useState } from 'react';

interface UseInViewOptions {
  threshold?: number;
  triggerOnce?: boolean;
}

interface UseInViewResult {
  inView: boolean;
  ref: (node: Element | null) => void;
}

export function useInView({
  threshold = 0.2,
  triggerOnce = true,
}: UseInViewOptions = {}): UseInViewResult {
  const [inView, setInView] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const nodeRef = useRef<Element | null>(null);

  const cleanup = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const ref = useCallback(
    (node: Element | null) => {
      cleanup();
      nodeRef.current = node;

      if (!node) return;

      var observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setInView(true);
            if (triggerOnce) {
              observer.disconnect();
              observerRef.current = null;
            }
          } else if (!triggerOnce) {
            setInView(false);
          }
        },
        { threshold },
      );

      observer.observe(node);
      observerRef.current = observer;
    },
    [threshold, triggerOnce, cleanup],
  );

  return { ref, inView };
}
