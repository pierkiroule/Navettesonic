import { useState } from "react";
import RadialMenu from "./RadialMenu.jsx";

const DEMO_ITEMS = [
  { id: "edit", label: "Éditer" },
  { id: "share", label: "Partager" },
  { id: "duplicate", label: "Dupliquer" },
  { id: "archive", label: "Archiver" }
];

export default function RadialMenuDemo() {
  const [anchor, setAnchor] = useState(null);
  const [lastAction, setLastAction] = useState("Aucune action");

  return (
    <section className="radial-demo">
      <p className="home-note">Demo RadialMenu — clic ou tactile</p>
      <button
        className="secondary-btn"
        type="button"
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setAnchor({ x: rect.left + rect.width / 2, y: rect.top - 10 });
        }}
      >
        Ouvrir actions contextuelles
      </button>
      <p className="home-note">Dernière action: {lastAction}</p>
      {anchor && (
        <RadialMenu
          items={DEMO_ITEMS}
          anchor={anchor}
          aria-label="Menu d'actions contextuelles"
          onClose={() => setAnchor(null)}
          onSelect={(item) => setLastAction(item.label)}
        />
      )}
    </section>
  );
}
