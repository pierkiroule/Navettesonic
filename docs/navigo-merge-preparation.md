# Préparation — Fusion Tracer/Traverser dans l’onglet Navigo

## Objectif
Fusionner les deux écrans **Tracer** et **Traverser** dans une seule vue Navigo avec un toggle interne, sans retrait fonctionnel.

## Contraintes validées
- Toggle visible en permanence dans Navigo: **Tracer | Traverser**.
- État partagé unique entre les deux sous-vues:
  - chemin (path)
  - statut d’exécution (play/pause/idle)
  - métadonnées (marqueurs/profondeur/export)
- Aucune fonctionnalité retirée.

## Livrables cibles
1. **Nouveau composant `NavigoView`**
2. **Tests d’intégration** couvrant la transition **Tracer -> Traverser**

---

## Proposition d’architecture (sans implémentation)

### 1) Nouveau composant `NavigoView`
Responsabilité:
- Encapsuler le toggle interne `Tracer | Traverser`.
- Exposer une API de props unique vers le parent (`SoonApp`).
- Piloter les sous-sections UI actuellement réparties entre les modes `trace` et `travel`.

Contrat de props proposé:
- `activeTab: 'trace' | 'travel'`
- `onChangeTab(tab)`
- `sharedState` (objet unique)
- `actions` (callbacks métier: path, markers, export, playback)

### 2) Shared state unique
Créer/centraliser une structure d’état unique (au niveau parent ou store), exemple:
- `path`: points du tracé
- `execution`:
  - `isPlaying`
  - `speed`
  - `lastTickAt`
- `metadata`:
  - `depthMarkers`
  - `selectedDepth`
  - `exportStatus`
  - `exportUrl`

Règles:
- Aucun reset implicite lors du switch de tab.
- Le switch `Tracer -> Traverser` conserve le path et les métadonnées.
- `Traverser` ne peut lancer Play que si le path est valide (>= 2 points).

### 3) Migration UI
- Déplacer les contrôles spécifiques Tracer/Traverser dans `NavigoView`.
- Garder les icônes/labels existants pour ne pas casser les habitudes.
- Mettre à jour les `aria-label` pour le toggle interne.

### 4) Stratégie de non-régression
Checklist fonctionnelle:
- Tracer:
  - dessin du chemin
  - ajout marqueurs profondeur
- Traverser:
  - play/pause
  - génération immersion
- comportements transverses:
  - recenter
  - vitesse
  - statut d’export

---

## Plan de tests d’intégration (cible)

### Scénario principal: transition `Tracer -> Traverser`
1. Ouvrir Navigo sur Tracer.
2. Tracer un chemin (>= 2 points).
3. Basculer vers Traverser via le toggle.
4. Vérifier:
   - le chemin est conservé
   - le bouton Play est activé
   - les métadonnées existantes sont intactes
5. Lancer Play puis Pause.
6. Revenir sur Tracer.
7. Vérifier l’absence de perte d’état.

### Scénarios complémentaires
- Toggle avec chemin vide: Play désactivé côté Traverser.
- Export indisponible si seuil de points non atteint.
- Aucune exception console au switch rapide multi-fois.

### Fichiers de test prévus
- `tests/navigo-transition.integration.test.(jsx|tsx)`
- optionnel: `tests/navigo-shared-state.integration.test.(jsx|tsx)`

---

## Découpage de réalisation suggéré
1. Introduire `NavigoView` (squelette + toggle + props).
2. Brancher le shared state unique.
3. Migrer les contrôles Tracer/Traverser.
4. Ajouter tests d’intégration.
5. Passer non-régression manuelle + CI.

## Critères d’acceptation
- Le toggle **Tracer | Traverser** est visible dans Navigo.
- Le state est partagé et persistant entre tabs.
- Aucune fonctionnalité existante n’est supprimée.
- Les tests d’intégration `Tracer -> Traverser` passent.
