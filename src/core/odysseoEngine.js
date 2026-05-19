import { getDepthAtPathIndex, stepOdysseoTraversal } from "./odysseoPath.js";

export function tickOdysseoEngine(state, { swimSpeed = 1 } = {}) {
  const result = stepOdysseoTraversal({
    path: state.odysseoPath || [],
    index: state.odysseoPathIndex || 0,
    direction: state.odysseoDirection || 1,
    speed: Math.max(0, swimSpeed * 0.22),
  });
  if (!result.point) return state;
  const depth = getDepthAtPathIndex(state.odysseoDepthMarkers || [], Math.round(result.index));
  return {
    odysseoPathIndex: result.index,
    odysseoDirection: result.direction,
    circuitAutopilot: false,
    fish: { ...state.fish, x: result.point.x, y: result.point.y, targetX: result.point.x, targetY: result.point.y, depth, angle: result.angle, vx: Math.cos(result.angle) * swimSpeed, vy: Math.sin(result.angle) * swimSpeed },
  };
}
