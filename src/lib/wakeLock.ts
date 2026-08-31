import { useEffect, useRef, useState } from 'react';

type WakeLockSentinel = { release: () => Promise<void>; addEventListener: (t: string, cb: () => void) => void };

// Screen Wake Lock for cook mode: keeps the phone screen on while cooking.
// Chromium + iOS 16.4+; silently unsupported elsewhere.
export function useWakeLock(active: boolean): { supported: boolean } {
  const [supported] = useState(
    () => typeof navigator !== 'undefined' && 'wakeLock' in navigator
  );
  const lockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!supported || !active) return;
    let cancelled = false;

    const acquire = async () => {
      try {
        const nav = navigator as Navigator & { wakeLock: { request: (t: 'screen') => Promise<WakeLockSentinel> } };
        const lock = await nav.wakeLock.request('screen');
        if (cancelled) {
          lock.release();
          return;
        }
        lockRef.current = lock;
      } catch {
        // low battery or unsupported — carry on without
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') acquire();
    };

    acquire();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      lockRef.current?.release().catch(() => undefined);
      lockRef.current = null;
    };
  }, [supported, active]);

  return { supported };
}
