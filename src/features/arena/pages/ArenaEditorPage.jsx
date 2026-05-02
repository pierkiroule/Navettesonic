import { useMemo } from 'react';

import { FishController } from '../components/FishController';
import { useArenaEditor } from '../hooks/useArenaEditor';
import { arenaDomainService } from '../services/arenaDomainService';
import { shellStyles } from '../ui/shellMockups';

const STATUS_LABELS = {
  [arenaDomainService.ARENA_STATUSES.DRAFT]: 'Brouillon',
  [arenaDomainService.ARENA_STATUSES.PUBLISHED]: 'Publié',
  [arenaDomainService.ARENA_STATUSES.ARCHIVED]: 'Archivé',
};

const CTA_BY_TRANSITION = {
  [arenaDomainService.ARENA_STATUSES.PUBLISHED]: 'Publier l’arène',
  [arenaDomainService.ARENA_STATUSES.ARCHIVED]: 'Archiver l’arène',
};

export function ArenaEditorPage() {
  const {
    bubbles,
    status,
    isProcessing,
    feedback,
    inviteLink,
    addBubble,
    updateBubble,
    removeBubble,
    publish,
    setFeedback,
  } = useArenaEditor();
  const actorRole = arenaDomainService.ACTOR_ROLES.OWNER;

  const publicationPolicy = useMemo(
    () => arenaDomainService.getScreenPolicy({ status, actorRole }),
    [status, actorRole],
  );

  const primaryTransition = publicationPolicy.allowedTransitions?.[0] ?? null;
  const ctaLabel = primaryTransition ? CTA_BY_TRANSITION[primaryTransition] ?? 'Changer le statut' : 'Arène finalisée';

  const handlePrimaryCta = async () => {
    if (!primaryTransition || isProcessing) return;
    if (primaryTransition === arenaDomainService.ARENA_STATUSES.PUBLISHED) {
      await publish();
    }
  };

  const handleCopyLink = async () => {
    if (!inviteLink) {
      setFeedback({ type: 'error', message: 'Erreur métier (arena-unpublished) : publiez d’abord l’arène pour récupérer le lien.', code: 'arena-unpublished' });
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteLink);
      setFeedback({ type: 'success', message: 'Lien copié dans le presse-papiers.' });
    } catch {
      setFeedback({ type: 'error', message: 'Erreur métier (network) : impossible de copier le lien pour le moment.', code: 'network' });
    }
  };

  const handleInviteVisitors = async () => {
    if (!inviteLink) {
      setFeedback({ type: 'error', message: 'Erreur métier (arena-unpublished) : publiez d’abord l’arène pour partager.', code: 'arena-unpublished' });
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Invitation Soon•°',
          text: 'Entre dans mon arène sonore.',
          url: inviteLink,
        });
        setFeedback({ type: 'success', message: 'Invitation prête et partagée.' });
        return;
      } catch {
      }
    }

    try {
      await navigator.clipboard.writeText(inviteLink);
      setFeedback({ type: 'success', message: 'Invitation copiée.' });
    } catch {
      setFeedback({ type: 'error', message: `Erreur métier (network) : impossible de partager automatiquement. Lien : ${inviteLink}`, code: 'network' });
    }
  };

  return (
    <section style={shellStyles.layout}>
      <header style={shellStyles.header}>
        <strong>Composer mon arène</strong>
        <button type="button" onClick={() => addBubble()} disabled={!publicationPolicy.canWrite || isProcessing}>
          Ajouter une bulle
        </button>
      </header>

      <div style={shellStyles.bodyHost}>
        <article style={shellStyles.canvas}>
          <h1 style={{ marginTop: 0 }}>Bulles</h1>
          <p>Éditez les bulles métier (position, libellé, taille) sans dépendance DOM legacy.</p>
          <ul>
            {bubbles.map((bubble) => (
              <li key={bubble.id} style={{ marginBottom: 12 }}>
                <label>
                  Nom :{' '}
                  <input
                    value={bubble.label}
                    onChange={(event) => updateBubble(bubble.id, { label: event.target.value })}
                    disabled={!publicationPolicy.canWrite}
                  />
                </label>{' '}
                <label>
                  X :{' '}
                  <input
                    type="number"
                    value={Math.round(bubble.x)}
                    onChange={(event) => updateBubble(bubble.id, { x: Number(event.target.value) || 0 })}
                    disabled={!publicationPolicy.canWrite}
                    style={{ width: 64 }}
                  />
                </label>{' '}
                <label>
                  Y :{' '}
                  <input
                    type="number"
                    value={Math.round(bubble.y)}
                    onChange={(event) => updateBubble(bubble.id, { y: Number(event.target.value) || 0 })}
                    disabled={!publicationPolicy.canWrite}
                    style={{ width: 64 }}
                  />
                </label>{' '}
                <label>
                  Taille :{' '}
                  <input
                    type="number"
                    value={Math.round(bubble.size)}
                    onChange={(event) => updateBubble(bubble.id, { size: Number(event.target.value) || 1 })}
                    disabled={!publicationPolicy.canWrite}
                    style={{ width: 64 }}
                  />
                </label>{' '}
                <button type="button" onClick={() => removeBubble(bubble.id)} disabled={!publicationPolicy.canWrite}>
                  Supprimer
                </button>
                <FishController bubble={bubble} onMove={updateBubble} />
              </li>
            ))}
          </ul>
        </article>

        <aside style={shellStyles.panel}>
          <h2 style={{ marginTop: 0 }}>Parcours hôte</h2>
          <p style={{ marginTop: 0 }}>Composer → Régler les bulles → Publier → Copier le lien.</p>
          <p>État courant : <strong>{STATUS_LABELS[status]}</strong></p>
          <p>Rôle : <strong>{actorRole}</strong></p>
          <p>Écran cible : <strong>{publicationPolicy.screen}</strong></p>
          <p>Édition : <strong>{publicationPolicy.canWrite ? 'autorisée' : 'verrouillée'}</strong></p>
          <button type="button" onClick={handlePrimaryCta} disabled={!primaryTransition || isProcessing}>
            {ctaLabel}
          </button>
          <button type="button" onClick={handleCopyLink} disabled={isProcessing} style={{ marginLeft: 8 }}>
            Copier le lien
          </button>
          <button type="button" onClick={handleInviteVisitors} disabled={isProcessing} style={{ marginLeft: 8 }}>
            Partager le lien
          </button>
          {inviteLink ? <p style={{ marginTop: 8 }}>Lien d’invitation : {inviteLink}</p> : null}
          {feedback ? (
            <p role="status" style={{ marginTop: 12 }}>
              {feedback.message}
            </p>
          ) : null}
        </aside>
      </div>

      <footer style={shellStyles.feedback}>Flow MVP : composer, publier, partager une consultation en lecture seule.</footer>
    </section>
  );
}
