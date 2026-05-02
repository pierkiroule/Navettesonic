import { useMemo, useState } from 'react';

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
  const { bubbles, addBubble, updateBubble, removeBubble } = useArenaEditor();
  const actorRole = arenaDomainService.ACTOR_ROLES.OWNER;
  const [status, setStatus] = useState(arenaDomainService.ARENA_STATUSES.DRAFT);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const publicationPolicy = useMemo(
    () => arenaDomainService.getScreenPolicy({ status, actorRole }),
    [status, actorRole],
  );

  const primaryTransition = publicationPolicy.allowedTransitions?.[0] ?? null;
  const ctaLabel = primaryTransition ? CTA_BY_TRANSITION[primaryTransition] ?? 'Changer le statut' : 'Arène finalisée';

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
  };

  const handlePrimaryCta = async () => {
    if (!primaryTransition || isProcessing) return;
    if (primaryTransition === arenaDomainService.ARENA_STATUSES.PUBLISHED && bubbles.length === 0) {
      showFeedback('error', 'Erreur métier : ajoutez au moins une bulle avant la publication.');
      return;
    }

    setIsProcessing(true);
    showFeedback('loading', 'Chargement : publication en cours...');

    await new Promise((resolve) => setTimeout(resolve, 650));
    setStatus(primaryTransition);
    setIsProcessing(false);
    showFeedback('success', 'Publication réussie : votre arène est maintenant disponible en lecture.');
  };

  const handleCopyLink = async () => {
    const roomCode = 'demo-arena';
    const shareUrl = `${window.location.origin}/?room=${roomCode}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      showFeedback('success', 'Lien copié dans le presse-papiers.');
    } catch {
      showFeedback('error', 'Erreur réseau : impossible de copier le lien pour le moment.');
    }
  };

  return (
    <section style={shellStyles.layout}>
      <header style={shellStyles.header}>
        <strong>Éditeur d’arène</strong>
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
          <h2 style={{ marginTop: 0 }}>Publication</h2>
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
          {feedback ? (
            <p role="status" style={{ marginTop: 12 }}>
              {feedback.message}
            </p>
          ) : null}
        </aside>
      </div>

      <footer style={shellStyles.feedback}>
        Composer, publier, partager.
      </footer>
    </section>
  );
}
