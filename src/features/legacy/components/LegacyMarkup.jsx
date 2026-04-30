import legacyMarkup from '../runtime/legacyMarkup.html?raw';

function LegacyMarkup() {
  return <div dangerouslySetInnerHTML={{ __html: legacyMarkup }} />;
}

export default LegacyMarkup;
