export const SOON_MODE_INTRO = "intro";
export const SOON_MODE_COMPO = "compo";
export const SOON_MODE_RESO = "reso";

export const SOON_MODES_ALLOWED = [SOON_MODE_INTRO, SOON_MODE_COMPO, SOON_MODE_RESO];

export const WORKFLOW_ROOT_COMPO = "compo";
export const WORKFLOW_ROOT_NAVIGO = "navigo";
export const WORKFLOW_ROOT_ALLOWED = [WORKFLOW_ROOT_COMPO, WORKFLOW_ROOT_NAVIGO];

export const ODYSSEO_MODE_TRACE = "trace";
export const ODYSSEO_MODE_TRAVEL = "travel";
export const ODYSSEO_MODES_ALLOWED = [ODYSSEO_MODE_TRACE, ODYSSEO_MODE_TRAVEL];

export function isSoonMode(value) {
  return SOON_MODES_ALLOWED.includes(value);
}

export function normalizeSoonMode(value, fallback = SOON_MODE_COMPO) {
  return isSoonMode(value) ? value : fallback;
}

export function normalizeWorkflowRoot(value) {
  return value === WORKFLOW_ROOT_NAVIGO ? WORKFLOW_ROOT_NAVIGO : WORKFLOW_ROOT_COMPO;
}

export function modeToWorkflowRoot(mode) {
  return mode === SOON_MODE_COMPO ? WORKFLOW_ROOT_COMPO : WORKFLOW_ROOT_NAVIGO;
}

export function workflowRootToMode(root) {
  return root === WORKFLOW_ROOT_NAVIGO ? SOON_MODE_RESO : SOON_MODE_COMPO;
}

export function normalizeOdysseoMode(value, fallback = ODYSSEO_MODE_TRACE) {
  return ODYSSEO_MODES_ALLOWED.includes(value) ? value : fallback;
}
