import '../runtime/legacy.css';
import LegacyMarkup from './LegacyMarkup';
import LegacyRuntimeBootstrap from './LegacyRuntimeBootstrap';

function LegacyShell() {
  return (
    <>
      <LegacyRuntimeBootstrap />
      <LegacyMarkup />
    </>
  );
}

export default LegacyShell;
