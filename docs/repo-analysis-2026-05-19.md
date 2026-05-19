# Analyse rapide du dépôt (19 mai 2026)

## Vue d’ensemble

- Projet front-end React + Vite avec moteur temps réel local (poisson, bulles, navigation) et état global Zustand.
- Intégration Supabase (migrations SQL nombreuses) pour persistance et contraintes de sécurité.
- Couverture de tests Node (`node --test`) sur logique cœur (navigation, physique, monde, store, workflow).

## Points solides

1. **Socle technique clair** : `react`, `vite`, `zustand`, `@supabase/supabase-js`.
2. **Tests ciblés** sur le domaine métier/interaction, pas uniquement UI.
3. **Séparation partielle** entre `src/core`, `src/store`, `src/components`, `src/pages`.

## Risques et incohérences

1. **README obsolète**
   - Le README décrit une arborescence `src/features/...` qui ne correspond plus à l’arborescence réelle actuelle (`src/core`, `src/store`, etc.).
2. **Fichiers parasites à la racine**
   - Deux fichiers atypiques existent à la racine: `eState } from react` et `sName="topbar">`.
   - Leur contenu ressemble à des sorties terminal/artefacts, pas à du code applicatif.
3. **Dette d’architecture**
   - `SoonApp.jsx` concentre beaucoup d’états et de comportements; composant volumineux susceptible de freiner l’évolutivité.

## Recommandations prioritaires

1. **Nettoyage repo**
   - Supprimer/archiver les fichiers parasites racine après validation humaine.
2. **Remise à jour README**
   - Aligner les sections “Architecture actuelle”, “fichiers principaux”, “stack” avec l’état réel du code.
3. **Refactor progressif de `SoonApp`**
   - Extraire logique d’orchestration (hooks dédiés par sous-domaine: export immersion, workflow root, audio feedback, mode interaction).
4. **Hygiène CI**
   - Ajouter un check de repo propre (détection fichiers inattendus) et lint/format si non présent.

## Commandes utiles

- Lancer les tests: `npm test`
- Build de validation: `npm run build`

