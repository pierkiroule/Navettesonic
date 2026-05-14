export default function NavigoView({ mode, onChangeMode, children }) {
  const isTrace = mode === "trace";

  return (
    <section className="navigo-view" aria-label="Navigo">
      <div className="navigo-substeps" role="group" aria-label="Étapes Navigo">
        <button
          type="button"
          onClick={() => onChangeMode("trace")}
          className={isTrace ? "active" : ""}
          aria-label="Tracer"
          title="Tracer"
        >
          Tracer
        </button>
        <button
          type="button"
          onClick={() => onChangeMode("travel")}
          className={!isTrace ? "active" : ""}
          aria-label="Traverser"
          title="Traverser"
        >
          Traverser
        </button>
      </div>

      {children}
    </section>
  );
}
