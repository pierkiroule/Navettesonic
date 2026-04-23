import { useEffect } from 'react';

export function useLegacyBootstrap() {
  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      const { initLegacyApp } = await import('../runtime/legacyApp.js');
      if (!cancelled) {
        initLegacyApp();
      }
    };

    boot();

    return () => {
      cancelled = true;
    };
  }, []);
}
