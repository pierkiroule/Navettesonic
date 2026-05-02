import { useState } from 'react';

export function AppLanding() {
  const [roomInput, setRoomInput] = useState('');

  const goToEditor = () => {
    window.location.search = '?arena=editor';
  };

  const joinRoom = (event) => {
    event.preventDefault();
    const room = roomInput.trim();
    if (!room) return;
    window.location.search = `?room=${encodeURIComponent(room)}`;
  };

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem' }}>
      <section style={{ width: '100%', maxWidth: 640, display: 'grid', gap: '1rem' }}>
        <h1>Soon•°</h1>
        <p>Choisis ton parcours : créer une arène ou rejoindre une arène publiée.</p>

        <button type="button" onClick={goToEditor}>
          Composer mon arène
        </button>

        <form onSubmit={joinRoom} style={{ display: 'grid', gap: '0.5rem' }}>
          <label htmlFor="room">Rejoindre avec un room slug</label>
          <input
            id="room"
            name="room"
            value={roomInput}
            onChange={(event) => setRoomInput(event.target.value)}
            placeholder="ex: abc123"
          />
          <button type="submit">Entrer dans l’arène</button>
        </form>
      </section>
    </main>
  );
}
