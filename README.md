# Navettesonic (React + Vite)

Application Soon•° migrée sur une base **React + Vite** avec conservation du flow/UX existant.

## Stack

- React 18
- Vite 5
- Runtime legacy encapsulé dans `src/features/legacy/runtime/`

## Architecture actuelle

- `index.html` : shell Vite minimal + scripts CDN nécessaires (Tailwind, Supabase).
- `src/main.jsx` : point d’entrée React + `StrictMode`.
- `src/app/App.jsx` : orchestration de l’application.
- `src/features/legacy/components/LegacyShell.jsx` : rend le markup historique.
- `src/features/legacy/hooks/useLegacyBootstrap.js` : initialise le runtime legacy une seule fois.
- `src/features/legacy/runtime/legacyMarkup.html` : structure DOM historique.
- `src/features/legacy/runtime/legacy.css` : styles historiques.
- `src/features/legacy/runtime/legacyApp.js` : logique historique encapsulée (`initLegacyApp`).


## Objectif d'architecture (React multifichiers)

La cible est une application **100% React structurée par features**, où le runtime legacy est uniquement transitoire.

- Audit détaillé: `docs/architecture-audit.md`
- Règle projet: toute nouvelle logique doit être ajoutée en composants/hooks/services React, pas dans `legacyApp.js`.

Structure cible:

```
src/
  app/
  features/
    arena/
    auth/
    profile/
    echohypnose/
  integrations/
    supabase/
  shared/
```

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

Le code legacy a été regroupé dans `src/features/legacy/` afin de:

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

### Re-déploiement Vercel + resynchronisation base (procédure manuelle)

Si vous devez forcer un redeploy Vercel **et** resynchroniser la base Supabase:

```bash
# 1) Lier le projet Supabase puis pousser les migrations
supabase link --project-ref <SUPABASE_PROJECT_ID>
supabase db push

# 2) Déclencher un nouveau déploiement Vercel en production
vercel --prod
```

Option recommandée en CI: exécuter d'abord `supabase db push` puis `vercel --prod` dans le même pipeline pour garantir que le schéma est à jour avant le build/runtime.

### Synchronisation profil ↔ Supabase

Le profil est simplifié autour de 3 besoins : auth (connexion/inscription/session), achat d’expériences Échohypnose (simulé), et historique horodaté.

- `public.user_profile_collections` (RLS): synchronise les expériences achetées.
- `public.echohypnose_session_history` (RLS): stocke l’historique horodaté des sessions achetées.

### Gestion multiutilisateur (arènes partagées)

L’interface affiche la section **Gestion multiutilisateur** avec :

#### Mode simple (sans se soucier des IDs techniques)

Le multiutilisateur repose sur un **code court** (ex: `ABC-123`).
L’ID Supabase (UUID) de l’arène est interne et ne doit pas être utilisé côté utilisateur.

1. **Hôte**: clique **Partager mon arène**.
2. **Hôte**: partage uniquement le **code d’invitation** affiché.
3. **Invité**: clique **Rejoindre**, colle le code, valide.

Astuce UI: le badge affiche `Arène partagée: ...`. Si aucun code n’est prêt, il affiche `code non généré`.


- Création d’arène
- Rejoindre via code (`ABC-123`)
- Invitation d’un proche depuis une arène active

Si le message suivant apparaît :

> `Arène indisponible: tables Supabase manquantes. Lance les migrations puis réessaie.`

cela signifie que les migrations SQL de `supabase/migrations/` n’ont pas encore été appliquées sur votre projet Supabase cible.

#### Commandes de correction (local)

```bash
supabase link --project-ref <SUPABASE_PROJECT_ID>
supabase db push
```

Puis rechargez l’application et réessayez **Créer mon arène** ou **Rejoindre**.


#### Vérification post-migration (Soonbase)

Après `supabase db push`, vous pouvez vérifier la structure attendue avec:

```bash
supabase db query < supabase/scripts/verify_soonbase_schema.sql
```

Le résultat doit indiquer aucune table/colonne manquante et RPC `accept_arena_invite` présente.


## Multiutilisateur (schéma cible)

Le flux principal utilise uniquement `public.arenas`, `public.arena_participants` et `public.arena_bubbles`.

Tables legacy `soon_*` conservées en base mais **non utilisées** dans le flux principal.

Flux:
1. L’hôte crée une arène (`arenas`) et reçoit `invite_code`.
2. L’invité rejoint via ce `invite_code` (sans table d’invitation séparée).
3. Les participants sont upsertés dans `arena_participants`.
4. Les bulles sont synchronisées via `arena_bubbles` (realtime filtré par `arena_id`).

`arena.id` est un identifiant interne et n’est jamais partagé à l’utilisateur.
