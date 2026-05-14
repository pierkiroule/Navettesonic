# Migration UI — WorkflowShell

## Ce qui change
- Le header principal expose désormais un `WorkflowShell` avec 2 onglets racine:
  - **1/2 Compo**
  - **2/2 Navigo**
- Les sous-étapes Navigo `Trace` et `Travel` restent disponibles via les boutons 🪶 / 🧭.

## Compatibilité backward
- Les routes hash legacy sont conservées:
  - `#trace` -> onglet **Navigo**, sous-étape **Trace**
  - `#travel` -> onglet **Navigo**, sous-étape **Travel**
- Les routes hash explicites nouvelles sont aussi supportées:
  - `#compo`
  - `#navigo` (ouvre Navigo sur Trace)

## Persistance
- Le dernier onglet racine actif est persisté dans `localStorage` via la clé:
  - `soon.workflow.root`

## Mapping anciens écrans
- Ancien écran/état **Composer** -> onglet racine **Compo**.
- Anciens écrans/états **Tracer** + **Traverser** -> onglet racine **Navigo** avec sous-étapes dédiées.
