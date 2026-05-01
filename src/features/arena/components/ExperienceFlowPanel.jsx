const HOST_STEPS = ['Composer mon arène', 'Publier', 'Partager mon arène'];
const VISITOR_STEPS = ['Ouvrir le lien', 'Piloter son poisson rose', 'Écouter'];

function StepList({ title, steps, active }) {
  return (
    <section aria-label={title} style={{ opacity: active ? 1 : 0.55 }}>
      <h2 style={{ fontSize: '0.95rem', margin: 0 }}>{title}</h2>
      <ol style={{ margin: '8px 0 0', paddingLeft: '1.2rem' }}>
        {steps.map((step) => (
          <li key={step} style={{ marginBottom: '0.25rem' }}>
            {step}
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function ExperienceFlowPanel({ roomSlug = '' }) {
  const isVisitor = Boolean(roomSlug);
  return (
    <header
      style={{
        position: 'fixed',
        zIndex: 20,
        top: 12,
        left: 12,
        right: 12,
        padding: '10px 14px',
        background: 'rgba(7,9,14,0.72)',
        color: '#f8f0ff',
        border: '1px solid rgba(255,255,255,0.18)',
        borderRadius: 10,
        backdropFilter: 'blur(3px)'
      }}
    >
      <p style={{ margin: 0, fontWeight: 600 }}>
        {isVisitor ? 'Mode visiteur : lien d’arène détecté.' : 'Mode hôte : compose puis publie ton arène.'}
      </p>
      <div style={{ display: 'grid', gap: 12, marginTop: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
        <StepList title="Parcours hôte" steps={HOST_STEPS} active={!isVisitor} />
        <StepList title="Parcours visiteur" steps={VISITOR_STEPS} active={isVisitor} />
      </div>
    </header>
  );
}
