# Audit structurel – Navettesonic

## Diagnostic rapide

Le projet est bien en **React + Vite**, mais le cœur fonctionnel est encore essentiellement piloté par un runtime legacy monolithique injecté via `dangerouslySetInnerHTML`.

### Points déjà bons

- Entrée Vite/React propre (`src/main.jsx`, `src/app/App.jsx`).
- Isolation explicite du legacy sous `src/features/legacy/`.
- Séparation markup / style / logique legacy.

### Points bloquants pour une architecture “pro et maintenable”

1. **Monolithe métier**: `legacyApp.js` concentre orchestration UI, audio, DB, auth, multi-utilisateur, etc.
2. **UI impérative DOM**: nombreux `getElementById` + listeners manuels, non idiomatique React.
3. **Markup injecté en bloc**: rend le découpage composant + tests unitaires difficiles.
4. **Frontière legacy non contractuelle**: peu d’API claire entre React et le runtime hérité.

> ⚠️ Règle explicite: **pas de nouvelle feature dans legacy**.

## Cible recommandée (React multifichiers)

Adopter une architecture par domaines:

- `src/app/` : bootstrap, providers, routing.
- `src/features/arena/` : écran, hooks, composants, services.
- `src/features/auth/`
- `src/features/profile/`
- `src/features/echohypnose/`
- `src/shared/` : UI générique, utilitaires, config.
- `src/integrations/supabase/` : client + repositories.

## Plan de migration incrémental (sans big-bang)

1. **Figer le legacy comme “adapter”** (ne plus ajouter de logique dedans).
2. **Créer des composants React verticalement** (1 feature à la fois).
3. **Extraire les accès Supabase** vers des services testables.
4. **Basculer état UI vers hooks React** (zustand/context selon besoin).
5. **Supprimer progressivement** les zones de `legacyMarkup.html` migrées.

## Priorité court terme (sprint 1)

- Introduire une structure de dossiers cibles.
- Extraire une première feature simple (ex: nav + shell) en React natif.
- Ajouter des tests de non-régression sur la migration.
- Documenter la règle: “toute nouvelle feature doit être React native, pas legacy”.
