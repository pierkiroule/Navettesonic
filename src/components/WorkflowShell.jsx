import { WORKFLOW_ROOT_COMPO, WORKFLOW_ROOT_NAVIGO } from "../core/uiState.js";

export default function WorkflowShell({ activeRoot = WORKFLOW_ROOT_COMPO, onChangeRoot }) {
  const isCompo = activeRoot === WORKFLOW_ROOT_COMPO;

  return (
    <div className="workflow-shell" role="group" aria-label="Workflow principal">
      <div className="workflow-tabs" role="tablist" aria-label="Onglets racine">
        <button
          type="button"
          role="tab"
          aria-selected={isCompo}
          className={isCompo ? "active compo-tab" : "compo-tab"}
          onClick={() => onChangeRoot?.(WORKFLOW_ROOT_COMPO)}
        >
          Compo
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!isCompo}
          className={!isCompo ? "active navigo-tab" : "navigo-tab"}
          onClick={() => onChangeRoot?.(WORKFLOW_ROOT_NAVIGO)}
        >
          Navigo
        </button>
      </div>
    </div>
  );
}
