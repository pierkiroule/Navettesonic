export default function WorkflowShell({ activeRoot = "compo", onChangeRoot }) {
  const isCompo = activeRoot === "compo";

  return (
    <div className="workflow-shell" role="group" aria-label="Workflow principal">
      <div className="workflow-stepper" aria-live="polite">
        <span className={isCompo ? "active" : ""}>1/2 Compo</span>
        <span className={!isCompo ? "active" : ""}>2/2 Navigo</span>
      </div>

      <div className="workflow-tabs" role="tablist" aria-label="Onglets racine">
        <button
          type="button"
          role="tab"
          aria-selected={isCompo}
          className={isCompo ? "active" : ""}
          onClick={() => onChangeRoot?.("compo")}
        >
          Compo
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!isCompo}
          className={!isCompo ? "active" : ""}
          onClick={() => onChangeRoot?.("navigo")}
        >
          Navigo
        </button>
      </div>
    </div>
  );
}
