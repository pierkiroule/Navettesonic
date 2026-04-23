import legacyMarkup from '../runtime/legacyMarkup.html?raw';
import '../runtime/legacy.css';
import { useLegacyBootstrap } from '../hooks/useLegacyBootstrap';

function LegacyShell() {
  useLegacyBootstrap();

  return <div dangerouslySetInnerHTML={{ __html: legacyMarkup }} />;
}

export default LegacyShell;
