import { SOON_MODES } from "../core/soonModes.js";
import { useSoonStore } from "../store/useSoonStore.js";

export default function ModeDock() {
  const mode = useSoonStore((state) => state.mode);
  const setMode = useSoonStore((state) => state.setMode);

  return (
    <nav className="mode-dock" aria-label="Modes Soon">
      {SOON_MODES.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`mode-btn ${mode === item.id ? "active" : ""}`}
          onClick={() => setMode(item.id)}
          title={item.label}
        >
          <span className="mode-icon">{item.icon}</span>
          <span className="mode-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
