import { SOON_MODES } from "../core/soonModes.js";
import { useSoonStore } from "../store/useSoonStore.js";

export default function ModeDock({ onIntro }) {
  const mode = useSoonStore((state) => state.mode);
  const setMode = useSoonStore((state) => state.setMode);

  function handleModeClick(id) {
    if (id === "intro") {
      onIntro?.();
      return;
    }

    setMode(id);
  }

  return (
    <nav className="mode-dock simple-dock" aria-label="Navigation Soon">
      {SOON_MODES.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`mode-btn ${mode === item.id ? "active" : ""}`}
          onClick={() => handleModeClick(item.id)}
          title={item.label}
        >
          <span className="mode-icon">{item.icon}</span>
          <span className="mode-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
