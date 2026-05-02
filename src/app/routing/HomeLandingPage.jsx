import React from 'react';

export function HomeLandingPage() {
  return (
    <main style={{ padding: '2rem', maxWidth: '48rem', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>NavetteSonic</h1>
      <p>Bienvenue. Choisissez un parcours explicite :</p>
      <ul>
        <li>
          <a href="/editor">Mode éditeur</a>
        </li>
        <li>
          <a href="/visitor">Mode visiteur</a>
        </li>
      </ul>
      <p>Rollback temporaire disponible via <code>?legacy=1</code>.</p>
    </main>
  );
}
