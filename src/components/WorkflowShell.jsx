import { WORKFLOW_ROOT_COMPO, WORKFLOW_ROOT_NAVIGO } from "../core/uiState.js";

export default function WorkflowShell({ activeRoot = WORKFLOW_ROOT_COMPO, onChangeRoot }) {
  const isEchostory = activeRoot === WORKFLOW_ROOT_COMPO;
  const isTuto = activeRoot === "tuto";

  return (
    <div className="workflow-shell" role="group" aria-label="Workflow principal">
      <div className="workflow-tabs" role="tablist" aria-label="Onglets racine">
        <button
          type="button"
          role="tab"
          aria-selected={isTuto}
          className={isTuto ? "active tuto-tab" : "tuto-tab"}
          onClick={() => onChangeRoot?.("tuto")}
        >
          Tuto
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={isEchostory}
          className={isEchostory ? "active echostory-tab" : "echostory-tab"}
          onClick={() => onChangeRoot?.(WORKFLOW_ROOT_COMPO)}
        >
          Echostory
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!isEchostory}
          className={!isEchostory ? "active navigo-tab" : "navigo-tab"}
          onClick={() => onChangeRoot?.(WORKFLOW_ROOT_NAVIGO)}
        >
          Navigo
        </button>
      </div>
    </div>
  );
}
