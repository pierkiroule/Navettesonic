import { useEffect } from 'react';
import '../runtime/legacy.css';
import LegacyMarkup from './LegacyMarkup';
import LegacyRuntimeBootstrap from './LegacyRuntimeBootstrap';

function LegacyShell({ roomSlug = '' }) {
  useEffect(() => {
    document.body.dataset.roomSlug = roomSlug || '';
    return () => {
      delete document.body.dataset.roomSlug;
    };
  }, [roomSlug]);

  return (
    <>
      <LegacyRuntimeBootstrap />
      <LegacyMarkup />
    </>
  );
}

export default LegacyShell;
