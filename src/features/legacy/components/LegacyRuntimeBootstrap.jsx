import { useEffect } from 'react';
import * as supabase from '@supabase/supabase-js';
import { configureLegacyCallbacks, destroyLegacyApp, initLegacyApp } from '../runtime/legacyApp.js';

function LegacyRuntimeBootstrap() {
  useEffect(() => {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      window.supabase = supabase;
    }

    configureLegacyCallbacks({
      onError: (error) => {
        console.error('[legacy] runtime error', error);
      },
    });

    initLegacyApp();

    return () => {
      destroyLegacyApp();
    };
  }, []);

  return null;
}

export default LegacyRuntimeBootstrap;
