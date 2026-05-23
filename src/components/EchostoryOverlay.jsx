export default function EchostoryOverlay({ line, visible = false }) {
  if (!visible || !line) return null;

  return (
    <section aria-live="polite" className="echostory-overlay">
      <p>{line}</p>
    </section>
  );
}
