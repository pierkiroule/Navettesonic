import { arenaDomainService } from '../services/arenaDomainService.js';

export function ArenaPublishPanel({ roomCode, status = arenaDomainService.ARENA_STATUSES.DRAFT, actorRole = arenaDomainService.ACTOR_ROLES.OWNER }) {
  const policy = arenaDomainService.getScreenPolicy({ status, actorRole });
  const transitionLabels = {
    published: 'Publier',
    archived: 'Archiver',
  };

  return (
    <aside>
      <h3>Publication</h3>
      <p>État : <strong>{status}</strong></p>
      <p>Écran associé : <strong>{policy.screen}</strong></p>
      <p>Partage visiteur : {roomCode ? `?room=${roomCode}` : 'non publié'}</p>
      <p>Actions autorisées ({actorRole}) : {policy.canWrite ? 'édition' : 'lecture seule'}</p>
      {policy.canTransition && policy.allowedTransitions?.length ? (
        <p>Transitions possibles : {policy.allowedTransitions.map((next) => transitionLabels[next] || next).join(', ')}</p>
      ) : (
        <p>Transitions possibles : aucune</p>
      )}
    </aside>
  );
}
