import { useEffect } from 'react';

let legacyBootPromise = null;

async function ensureLegacyBootstrapped() {
  if (!legacyBootPromise) {
    legacyBootPromise = import('../runtime/legacyApp.js').then(({ initLegacyApp }) => {
      initLegacyApp();
    });
  }

  return legacyBootPromise;
}

export function useLegacyBootstrap() {
  useEffect(() => {
    ensureLegacyBootstrapped().catch((error) => {
      console.error('Legacy bootstrap failed:', error);
    });

    return undefined;
  }, []);
}
