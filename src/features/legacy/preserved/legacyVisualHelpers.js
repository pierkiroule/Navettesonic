export const SOON_GRADIENT = 'radial-gradient(circle at top, #203a70 0%, #111b36 45%, #090f1d 100%)';

export function fishTransform({ x, y }) {
  return {
    transform: `translate(${x}px, ${y}px)`,
  };
}
