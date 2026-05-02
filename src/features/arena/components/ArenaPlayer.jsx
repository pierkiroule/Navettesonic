export function ArenaPlayer({ mode = 'visitor' }) {
  return <p>Mode {mode === 'host' ? 'hôte' : 'visiteur'} · ambiance Soon•°</p>;
}
