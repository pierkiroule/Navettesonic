export default function WorkflowShell({ activeRoot = "compo", onChangeRoot }) {
  const isCompo = activeRoot === "compo";

  return (
    <div className="workflow-shell" role="group" aria-label="Workflow principal">
      <div className="workflow-tabs" role="tablist" aria-label="Onglets racine">
        <button
          type="button"
          role="tab"
          aria-selected={isCompo}
          className={isCompo ? "active compo-tab" : "compo-tab"}
          onClick={() => onChangeRoot?.("compo")}
        >
          Compo
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!isCompo}
          className={!isCompo ? "active navigo-tab" : "navigo-tab"}
          onClick={() => onChangeRoot?.("navigo")}
        >
          Navigo
        </button>
      </div>
    </div>
  );
}
