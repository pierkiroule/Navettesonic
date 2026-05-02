import { usePublishedArena } from '../hooks/usePublishedArena';
import { useRoomParam } from '../hooks/useRoomParam';
import { arenaDomainService } from '../services/arenaDomainService';
import { shellStyles } from '../ui/shellMockups';

const STANDARD_ERROR_UX = {
  'invalid-room-link': {
    title: 'Lien room invalide',
    message: 'Le lien de visite est incomplet ou mal formaté.',
    cta: { label: 'Retour à l’accueil', href: '/' },
  },
  'arena-unpublished': {
    title: 'Arène non publiée',
    message: 'Cette arène existe mais son accès visiteur n’est pas encore ouvert.',
    cta: { label: 'Demander un lien actif', href: '/' },
  },
  'arena-missing': {
    title: 'Arène absente ou supprimée',
    message: 'Ce lien ne correspond plus à une arène disponible.',
    cta: { label: 'Explorer les arènes publiques', href: '/' },
  },
  network: {
    title: 'Erreur réseau',
    message: 'Impossible de charger l’arène pour le moment. Vérifiez votre connexion puis réessayez.',
    cta: { label: 'Réessayer', action: () => window.location.reload() },
  },
};

export function ArenaVisitorPage() {
  const roomCode = useRoomParam();
  const { isLoading, arena, bubbles, error } = usePublishedArena(roomCode);

  if (!roomCode) return <p>Code room manquant.</p>;
  if (isLoading) return <p>Chargement de l’arène…</p>;
  if (error) {
    const ux = STANDARD_ERROR_UX[error.code] || STANDARD_ERROR_UX.network;
    return (
      <section>
        <h1>{ux.title}</h1>
        <p>{ux.message}</p>
        {error?.message ? <p>Détail technique : {error.message}</p> : null}
        {ux.cta.href ? <a href={ux.cta.href}>{ux.cta.label}</a> : null}
        {ux.cta.action ? <button onClick={ux.cta.action}>{ux.cta.label}</button> : null}
      </section>
    );
  }

  const policy = arenaDomainService.getScreenPolicy({
    status: arena?.status,
    actorRole: arenaDomainService.ACTOR_ROLES.VISITOR,
  });

  if (!policy.canRead) {
    return <p>Cette arène n’est pas disponible pour les visiteurs.</p>;
  }

  return (
    <section style={shellStyles.layout}>
      <header style={shellStyles.header}>
        <strong>Shell visiteur</strong>
        <span>UI minimale</span>
      </header>

      <div style={shellStyles.bodyVisitor}>
        <article style={shellStyles.canvas}>
          <h1 style={{ marginTop: 0 }}>{arena?.title || 'Arena visiteur'}</h1>
          <p>Expérience immersive en lecture seule.</p>
          <ul>
            {bubbles.map((bubble) => (
              <li key={bubble.id}>{bubble.label} ({Math.round(bubble.x)}, {Math.round(bubble.y)})</li>
            ))}
          </ul>
        </article>

        <aside style={{ ...shellStyles.panel, marginTop: 12, opacity: 0.86 }}>
          <h2 style={{ marginTop: 0 }}>Panel minimal</h2>
          <p>Actions autorisées : {policy.allowedActions.join(', ')}</p>
          <p>Les actions d’édition restent désactivées.</p>
        </aside>
      </div>

      <footer style={shellStyles.feedback}>
        Feedback : connexion visiteur stable, synchronisation passive active.
      </footer>
    </section>
  );
}
