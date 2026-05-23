export default function EchostoryOverlay({ line, visible = false }) {
  if (!visible || !line) return null;

  return (
    <section
      aria-live="polite"
      style={{
        position: "fixed",
        left: "50%",
        bottom: "12vh",
        transform: "translateX(-50%)",
        width: "min(92vw, 920px)",
        textAlign: "center",
        color: "rgba(241,248,255,0.95)",
        fontSize: "clamp(18px, 4.2vw, 34px)",
        fontWeight: 600,
        lineHeight: 1.35,
        letterSpacing: "0.02em",
        textShadow: "0 2px 14px rgba(0,0,0,0.55)",
        animation: "echostory-fade 380ms ease-out",
        pointerEvents: "none",
        zIndex: 30,
        padding: "0 10px",
      }}
    >
      {line}
      <style>{`@keyframes echostory-fade{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
    </section>
  );
}
