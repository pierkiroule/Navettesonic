import { useEffect } from 'react';
import legacyMarkup from './legacy/legacyMarkup.html?raw';
import './legacy/legacy.css';

function LegacyApp() {
  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      const { initLegacyApp } = await import('./legacy/legacyApp.js');
      if (!cancelled) {
        initLegacyApp();
      }
    };

    boot();

    return () => {
      cancelled = true;
    };
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: legacyMarkup }} />;
}

export default LegacyApp;
