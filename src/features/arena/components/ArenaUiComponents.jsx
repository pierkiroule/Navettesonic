export function ModeBadge({ mode = 'draft' }) {
  return <span>{mode}</span>;
}

export function ArenaStatusChip({ status = 'offline' }) {
  return <span>{status}</span>;
}

export function PublishButton({ disabled = false, onClick }) {
  return <button type="button" onClick={onClick} disabled={disabled}>Publier</button>;
}

export function CopyLinkButton({ disabled = false, onClick }) {
  return <button type="button" onClick={onClick} disabled={disabled}>Copier le lien</button>;
}

export function VisitorHintOverlay({ message = 'Partagez le lien visiteur pour inviter un participant.' }) {
  return (
    <aside>
      <p>{message}</p>
    </aside>
  );
}

export function ErrorStateCard({ title = 'Une erreur est survenue.', details = null, onRetry }) {
  return (
    <article>
      <h3>{title}</h3>
      {details ? <p>{details}</p> : null}
      {onRetry ? <button type="button" onClick={onRetry}>Réessayer</button> : null}
    </article>
  );
}

export function LoadingState({ label = 'Chargement...' }) {
  return <p aria-busy="true">{label}</p>;
}
