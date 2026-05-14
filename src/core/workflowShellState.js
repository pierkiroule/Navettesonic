export const WORKFLOW_ROOT_STORAGE_KEY = "soon.workflow.root";

export function normalizeWorkflowRoot(value) {
  return value === "navigo" ? "navigo" : "compo";
}

export function parseWorkflowFromHash(hash) {
  const raw = String(hash || "").replace(/^#/, "").replace(/^\//, "").toLowerCase();

  if (raw === "navigo") return { root: "navigo", odysseoMode: "trace" };
  if (raw === "compo") return { root: "compo", odysseoMode: null };

  // backward compatibility for legacy deep links
  if (raw === "trace") return { root: "navigo", odysseoMode: "trace" };
  if (raw === "travel") return { root: "navigo", odysseoMode: "travel" };

  return null;
}

export function serializeWorkflowHash(root, odysseoMode = "trace") {
  if (root === "navigo") {
    // keep old hash values so legacy routes still work
    return odysseoMode === "travel" ? "#travel" : "#trace";
  }

  return "#compo";
}

export function readPersistedWorkflowRoot(storage = globalThis?.localStorage) {
  try {
    return normalizeWorkflowRoot(storage?.getItem?.(WORKFLOW_ROOT_STORAGE_KEY));
  } catch {
    return "compo";
  }
}

export function persistWorkflowRoot(root, storage = globalThis?.localStorage) {
  try {
    storage?.setItem?.(WORKFLOW_ROOT_STORAGE_KEY, normalizeWorkflowRoot(root));
  } catch {
    // ignore persistence errors
  }
}
