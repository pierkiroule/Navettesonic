export function ArenaPublishPanel({ roomCode }) {
  return (
    <aside>
      <h3>Publication</h3>
      <p>Partage visiteur : {roomCode ? `?room=${roomCode}` : 'non publié'}</p>
    </aside>
  );
}
