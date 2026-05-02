import { fishTransform } from '../../legacy/preserved/legacyVisualHelpers';

export function FishPlume({ fish }) {
  return (
    <div className="fish-plume" style={fishTransform(fish)} aria-label="poisson plume">
      <svg viewBox="0 0 120 80" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="fishBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffc6de" />
            <stop offset="100%" stopColor="#7ce7ff" />
          </linearGradient>
        </defs>
        <g className="fish-tail"><path d="M18 40 L2 24 L2 56 Z" fill="#b2f0ff" /></g>
        <ellipse cx="62" cy="40" rx="36" ry="24" fill="url(#fishBody)" />
        <path className="fish-fin" d="M56 44 C72 68, 88 64, 98 42" stroke="#d5f8ff" strokeWidth="4" fill="none" />
        <circle cx="80" cy="34" r="3" fill="#111" />
      </svg>
    </div>
  );
}
