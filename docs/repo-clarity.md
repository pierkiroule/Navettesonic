# Repo clarity (2026-05-02)

Ce document sert de **source de vérité** pour distinguer le code actif du code historique.

## 1) Code actif (flow principal)

- `src/app/**`
- `src/features/arena/**`
- `src/integrations/supabase/client/**`
- `src/integrations/supabase/arenaRepository.js`

Ce périmètre correspond au produit actuel: création d’arène, publication, visiteur en lecture/exploration.

## 2) Code transitoire / legacy

- `src/features/legacy/**`

Le runtime legacy est conservé pour compatibilité, mais **toute nouvelle logique** doit être faite dans les modules React/feature modernes.

## 3) Historique DB vs schéma actuel

- Les migrations `supabase/migrations/**` contiennent l’historique complet.
- Le front actif s’appuie sur `arenas` / `arena_bubbles` (et non les anciennes tables `soon_*` pour le flux principal).

## 4) Règles de nettoyage appliquées

- Supprimer les modules non référencés par l’app active.
- Éviter les wrappers inutiles et conserver un chemin d’accès unique aux clients/services.
- Garder des erreurs explicites côté configuration (env manquantes) et des messages d’échec cohérents.

## 5) Prochaines étapes recommandées

1. Ajouter une CI qui exécute `npm test` + `npm run build` sur chaque PR.
2. Ajouter une vérification “unused exports/files” (ex: `knip`) pour éviter la dérive.
3. Isoler définitivement legacy dans un package/dossier dédié une fois le basculement terminé.
