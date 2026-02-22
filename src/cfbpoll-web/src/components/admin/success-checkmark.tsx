import { useEffect } from 'react';

interface SuccessCheckmarkProps {
  onDone: () => void;
}

export function SuccessCheckmark({ onDone }: SuccessCheckmarkProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <svg
      className="inline-block w-5 h-5 text-green-600 animate-[fadeInOut_2s_ease-in-out_forwards]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-label="Success"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
