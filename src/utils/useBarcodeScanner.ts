import { useEffect, useRef } from 'react';

interface BarcodeScannerOptions {
  onScan: (code: string) => void;
  enabled?: boolean;
  minLength?: number;
  maxInterval?: number; // ms between keystrokes to be considered a scanner
}

export function useBarcodeScanner({
  onScan,
  enabled = true,
  minLength = 4,
  maxInterval = 50,
}: BarcodeScannerOptions) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore modifier keys and function keys
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key.length > 1 && e.key !== 'Enter') return;

      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // If gap is too large, reset buffer (human typing detected)
      if (timeDiff > maxInterval && bufferRef.current.length > 0) {
        bufferRef.current = '';
      }

      if (e.key === 'Enter') {
        const code = bufferRef.current.trim();
        if (code.length >= minLength) {
          onScan(code);
          e.preventDefault();
        }
        bufferRef.current = '';
        return;
      }

      bufferRef.current += e.key;

      // Clear buffer after 200ms of inactivity (handles scanners without Enter)
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const code = bufferRef.current.trim();
        if (code.length >= minLength && timeDiff <= maxInterval) {
          onScan(code);
        }
        bufferRef.current = '';
      }, 200);
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, onScan, minLength, maxInterval]);
}
