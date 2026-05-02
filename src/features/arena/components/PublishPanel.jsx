export function PublishPanel({ onPublish, visitorUrl }) {
  return (
    <div className="soon-card">
      <button type="button" onClick={onPublish}>Publier</button>
      {visitorUrl ? <p>Lien visiteur : {visitorUrl}</p> : null}
    </div>
  );
}
