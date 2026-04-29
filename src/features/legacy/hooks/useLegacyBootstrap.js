import { useEffect } from 'react';
import * as supabase from '@supabase/supabase-js';

export function useLegacyBootstrap() {
  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      if (!window.supabase || typeof window.supabase.createClient !== 'function') {
        window.supabase = supabase;
      }
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
