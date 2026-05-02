# Contribuer à Soon•° / Navettesonic

Ce document fixe les conventions de base pour garder une architecture lisible après la refonte.

## Conventions de nommage et de structure

## Arborescence de référence

```txt
src/
  app/                # bootstrap global, providers, routing
  features/           # vertical slices métier
    <feature>/
      pages/          # pages/écrans de la feature
      components/     # composants React propres à la feature
      hooks/          # hooks métier/UI de la feature
      services/       # logique métier + orchestration use-cases
      utils/          # helpers purs locaux à la feature
      ui/             # primitives visuelles propres à la feature
      index.js        # exports publics de la feature
  integrations/       # accès systèmes externes (Supabase, APIs)
  shared/             # code transverse réutilisable
```

## Règles de nommage

- **Composants React**: `PascalCase.jsx` (`ArenaVisitorPage.jsx`).
- **Hooks**: `camelCase` préfixé par `use` (`useArenaEditor.js`).
- **Services et utilitaires**: `camelCase.js` (`arenaDomainService.js`, `roomLink.js`).
- **Constantes**: `camelCase.js` pour le fichier, `UPPER_SNAKE_CASE` pour les constantes exportées.
- **Fichiers de test**: `*.test.mjs` dans `tests/` (ou co-localisés si la suite évolue vers Vitest).
- **Barrels (`index.js`)**: exporter uniquement la surface publique d'un dossier, pas les détails internes.

## Règles de structure

- Toute nouvelle fonctionnalité métier doit vivre dans une **feature dédiée** (`src/features/<feature>`).
- Éviter d'ajouter de la logique nouvelle dans `src/features/legacy/runtime/` (sauf correctif strictement nécessaire).
- La logique d'accès données est centralisée dans `src/integrations/supabase/` puis consommée par les services de feature.
- Les utilitaires transverses vont dans `src/shared/utils/`; les utilitaires spécifiques restent dans la feature.

---

## Lint d'architecture et import boundaries

Objectif: éviter les dépendances croisées entre features.

## Règles obligatoires

1. `app` peut importer `features`, `shared`, `integrations`.
2. Une `feature` peut importer `shared` et `integrations`.
3. Une `feature` **ne doit pas** importer une autre `feature` directement.
4. `shared` ne doit importer aucune `feature`.
5. `integrations` ne doit importer aucune `feature`.

Schéma:

- `app -> features | shared | integrations`
- `features -> shared | integrations`
- `shared -> (aucune feature)`
- `integrations -> (aucune feature)`

## Mise en oeuvre pratique

- Vérifier les imports pendant les revues de code.
- En CI, ajouter progressivement une règle ESLint dédiée aux boundaries (ex: `no-restricted-imports` ou plugin de boundaries) alignée sur les règles ci-dessus.
- Refuser toute PR qui introduit une dépendance transversale feature -> feature.

---

## Stratégie de tests

La stratégie actuelle privilégie des tests rapides et stables.

## 1) Tests unitaires (priorité haute)

Couvrir en priorité:

- `utils` (fonctions pures de transformation/validation)
- `services` (règles métier, mapping, orchestration sans UI)

Critères:

- Cas nominal
- Cas limites
- Régressions connues

## 2) Smoke test du flux visiteur (priorité haute)

Maintenir un smoke test qui valide le flux minimum:

1. Résolution d'un lien `?room=...`
2. Chargement d'une arène publiée
3. Chargement des bulles associées
4. Affichage de la vue visiteur sans erreur bloquante

Ce smoke test sert de garde-fou sur le parcours principal "ouvrir -> entrer -> écouter".

## 3) Exécution locale

- `npm test` : exécute la suite Node test (`tests/*.test.mjs`).
- Ajouter un test à chaque correctif de bug critique sur le flux arène/visiteur.
