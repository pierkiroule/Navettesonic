# Navettesonic (React + Vite)

Application Soon•° migrée sur une base **React + Vite** avec conservation du flow/UX existant.

## Stack

- React 18
- Vite 5
- Runtime legacy encapsulé dans `src/legacy/`

## Architecture actuelle

- `index.html` : shell Vite minimal + scripts CDN nécessaires (Tailwind, Supabase).
- `src/main.jsx` : point d’entrée React.
- `src/App.jsx` : exporte l’application consolidée.
- `src/LegacyApp.jsx` : monte le markup historique et initialise le runtime legacy une seule fois.
- `src/legacy/legacyMarkup.html` : structure DOM historique.
- `src/legacy/legacy.css` : styles historiques.
- `src/legacy/legacyApp.js` : logique historique encapsulée (`initLegacyApp`).

## Démarrage

```bash
npm install
npm run dev
```

## Build production

```bash
npm run build
npm run preview
```

## Notes de consolidation

Le code legacy a été regroupé dans `src/legacy/` afin de:

1. garantir l’UX existante sans régression,
2. isoler l’existant,
3. permettre un refactor incrémental vers des composants React natifs.
