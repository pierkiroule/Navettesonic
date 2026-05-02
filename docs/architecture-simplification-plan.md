# Plan de simplification d’architecture (sans casse)

## Objectif
Réduire la complexité du runtime legacy en gardant un comportement fonctionnel identique côté hôte et visiteur.

## Principes anti-régression

1. **Brancher avant de remplacer** : introduire des adapters React autour du legacy avant d’extraire la logique.
2. **Feature flags de migration** : piloter chaque extraction par flag pour rollback immédiat.
3. **Tests de comportement métier** : vérifier les flows hôte/visiteur (création arène, publication, lecture via `?room=`) avant/après extraction.
4. **Contrats d’API figés** : ne pas modifier les interfaces de `arenaService` tant que les écrans legacy les consomment.
5. **Migration incrémentale** : 1 sous-domaine à la fois (routing, data, UI, runtime).

## Anti-patterns observés à éliminer progressivement

- Logique métier et manipulation DOM mêlées dans le runtime legacy.
- Dépendances implicites entre modules (state global + effets de bord).
- Multiplication des points d’entrée de données Supabase.
- Mapping des modèles dupliqué entre couches.

## Architecture cible recommandée

```txt
src/
  app/
    providers/
    routing/
  features/
    arena/
      components/
      hooks/
      services/
      mappers/
      state/
    legacy-bridge/
      adapters/
      featureFlags/
  integrations/
    supabase/
      client/
      repositories/
  shared/
    ui/
    hooks/
    lib/
    types/
```

## Plan d’exécution en 6 étapes

### Étape 1 — Cartographier et figer le comportement actuel
- Lister les parcours critiques (hôte et visiteur).
- Capturer des scénarios de non-régression (tests + checklist manuelle).
- Introduire un tableau “avant/après” des effets attendus.

### Étape 2 — Stabiliser la couche données
- Créer des repositories explicites dans `integrations/supabase/repositories`.
- Garder `arenaService` comme façade unique pendant la transition.
- Déplacer les mappers vers `features/arena/mappers`.

### Étape 3 — Isoler l’état métier
- Centraliser l’état “arena” (draft/published/loading/error) dans `features/arena/state`.
- Interdire les mutations directes depuis les composants legacy.
- Exposer des hooks (`useArena`, `useArenaBubbles`) consommables par React et adapters legacy.

### Étape 4 — Introduire le bridge legacy
- Encapsuler chaque interaction legacy dans un adapter dédié.
- Supprimer les accès DOM globaux hors adapters.
- Basculer écran par écran vers composants React natifs.

### Étape 5 — Standardiser l’UI
- Extraire composants partagés (`shared/ui`) pour boutons, panneaux, formulaires.
- Uniformiser les props et conventions de nommage.
- Retirer progressivement le markup legacy du flux principal.

### Étape 6 — Retirer le code mort
- Mesurer la couverture fonctionnelle migrée.
- Supprimer modules legacy non appelés.
- Nettoyer dépendances NPM inutilisées et CSS orpheline.

## KPI de simplification

- Réduction du nombre de fichiers modifiés par feature.
- Réduction du nombre de dépendances du runtime legacy.
- Temps de build inchangé ou amélioré.
- Zéro régression sur les parcours hôte/visiteur.

## Checklist PR “sans casse”

- [ ] Aucun changement de contrat DB/Supabase non prévu.
- [ ] Flows hôte/visiteur validés localement.
- [ ] Rollback possible via feature flag.
- [ ] Logs d’erreur inchangés ou plus explicites.
- [ ] Pas de nouvelle logique métier dans `legacyApp.js`.

## Ordre de priorité conseillé

1. Couche données (`repositories` + `mappers`)
2. État métier (`hooks` + `state`)
3. Bridge legacy (adapters)
4. UI React native
5. Suppression code mort

