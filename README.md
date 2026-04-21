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

## Connexion Supabase via GitHub Actions

Le workflow `.github/workflows/supabase-db-push.yml` permet de piloter les migrations Supabase depuis GitHub Actions.

### Secrets GitHub requis

Dans **Settings → Secrets and variables → Actions**, ajoutez :

- `SUPABASE_ACCESS_TOKEN` : Personal Access Token Supabase (Dashboard → Account → Access Tokens).
- `SUPABASE_PROJECT_ID` : project ref Supabase (ex: `abcd1234efgh5678`).
- `SUPABASE_DB_PASSWORD` : mot de passe de la base PostgreSQL du projet.

### Exécution

- Auto sur `push` vers `main` quand `supabase/**` change.
- Manuel via **Run workflow** avec option `dry_run=true` pour tester uniquement la connexion (sans `db push`).

### Vérification attendue

Le job valide d’abord les secrets, puis :

1. `supabase link --project-ref ...`
2. `supabase migration list` (test de connectivité)
3. `supabase db push` (si `dry_run=false`)

### Synchronisation profil ↔ Supabase

Une migration SQL est fournie pour créer la table `public.user_profile_collections` (RLS activée), utilisée par la page profil pour synchroniser les samples activés entre session locale et compte Supabase Auth.
