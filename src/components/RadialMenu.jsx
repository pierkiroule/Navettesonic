import { useEffect, useMemo, useState } from "react";

import { RADIAL_MENU_MIN_ITEMS, RADIAL_MENU_MAX_ITEMS, clampItems, getNextIndex } from "./radialMenuUtils.js";

function useAccessibilityFallback() {
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce), (forced-colors: active)");
    if (!query) return;
    const update = () => setFallback(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);
  return fallback;
}

export default function RadialMenu({ items, anchor, onSelect, onClose, disabled = false, "aria-label": ariaLabel }) {
  const compactItems = useMemo(() => clampItems(items), [items]);
  const shouldUseFallback = useAccessibilityFallback();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [anchor?.x, anchor?.y, compactItems.length]);

  if (!compactItems || compactItems.length < RADIAL_MENU_MIN_ITEMS) return null;

  const triggerSelect = (item, index) => {
    if (disabled || item.disabled) return;
    onSelect?.(item, index);
    onClose?.();
  };

  const onKeyDown = (event) => {
    if (event.key === "Escape") {
      onClose?.();
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      triggerSelect(compactItems[activeIndex], activeIndex);
      return;
    }
    const nextIndex = getNextIndex(activeIndex, compactItems.length, event.key);
    if (nextIndex !== activeIndex) {
      event.preventDefault();
      setActiveIndex(nextIndex);
    }
  };

  const style = {
    left: anchor?.x ?? 0,
    top: anchor?.y ?? 0
  };

  if (shouldUseFallback) {
    return (
      <ul className="radial-menu-fallback" role="menu" aria-label={ariaLabel} style={style} onKeyDown={onKeyDown}>
        {compactItems.map((item, index) => (
          <li key={item.id ?? item.label} role="none">
            <button
              type="button"
              role="menuitem"
              className="radial-menu-fallback-item"
              disabled={disabled || item.disabled}
              onClick={() => triggerSelect(item, index)}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="radial-menu" role="menu" aria-label={ariaLabel} style={style} onKeyDown={onKeyDown}>
      {compactItems.map((item, index) => {
        const angle = (Math.PI * 2 * index) / compactItems.length - Math.PI / 2;
        const x = Math.cos(angle) * 86;
        const y = Math.sin(angle) * 86;
        return (
          <button
            key={item.id ?? item.label}
            type="button"
            role="menuitem"
            className={`radial-menu-item ${activeIndex === index ? "is-active" : ""}`}
            style={{ transform: `translate(${x}px, ${y}px)` }}
            disabled={disabled || item.disabled}
            onMouseEnter={() => setActiveIndex(index)}
            onClick={() => triggerSelect(item, index)}
            onTouchStart={() => setActiveIndex(index)}
            onTouchEnd={() => triggerSelect(item, index)}
          >
            {item.label}
          </button>
        );
      })}
      <button type="button" className="radial-menu-center" onClick={onClose} aria-label="Fermer le menu radial">
        ✕
      </button>
    </div>
  );
}
