import { fishTransform } from '../../legacy/preserved/legacyVisualHelpers';

export function FishPlume({ fish }) {
  return (
    <div className="fish-plume" style={{ position: 'absolute', ...fishTransform(fish) }}>
      <span role="img" aria-label="poisson plume">
        🐟
      </span>
    </div>
  );
}
