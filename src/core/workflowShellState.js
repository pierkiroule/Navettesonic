import {
  ODYSSEO_MODE_TRACE,
  ODYSSEO_MODE_TRAVEL,
  WORKFLOW_ROOT_COMPO,
  WORKFLOW_ROOT_NAVIGO,
  normalizeWorkflowRoot,
} from "./uiState.js";

export { normalizeWorkflowRoot } from "./uiState.js";

export const WORKFLOW_ROOT_STORAGE_KEY = "soon.workflow.root";

export function parseWorkflowFromHash(hash) {
  const raw = String(hash || "").replace(/^#/, "").replace(/^\//, "").toLowerCase();

  if (raw === WORKFLOW_ROOT_NAVIGO) return { root: WORKFLOW_ROOT_NAVIGO, odysseoMode: ODYSSEO_MODE_TRACE };
  if (raw === WORKFLOW_ROOT_COMPO) return { root: WORKFLOW_ROOT_COMPO, odysseoMode: null };

  // backward compatibility for legacy deep links
  if (raw === ODYSSEO_MODE_TRACE) return { root: WORKFLOW_ROOT_NAVIGO, odysseoMode: ODYSSEO_MODE_TRACE };
  if (raw === ODYSSEO_MODE_TRAVEL) return { root: WORKFLOW_ROOT_NAVIGO, odysseoMode: ODYSSEO_MODE_TRAVEL };

  return null;
}

export function serializeWorkflowHash(root, odysseoMode = ODYSSEO_MODE_TRACE) {
  if (root === WORKFLOW_ROOT_NAVIGO) {
    // keep old hash values so legacy routes still work
    return odysseoMode === ODYSSEO_MODE_TRAVEL ? "#travel" : "#trace";
  }

  return "#compo";
}

export function readPersistedWorkflowRoot(storage = globalThis?.localStorage) {
  try {
    return normalizeWorkflowRoot(storage?.getItem?.(WORKFLOW_ROOT_STORAGE_KEY));
  } catch {
    return WORKFLOW_ROOT_COMPO;
  }
}

export function persistWorkflowRoot(root, storage = globalThis?.localStorage) {
  try {
    storage?.setItem?.(WORKFLOW_ROOT_STORAGE_KEY, normalizeWorkflowRoot(root));
  } catch {
    // ignore persistence errors
  }
}
