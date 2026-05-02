# Migration tracker (legacy decommission)

Légende des états : `Not started` / `In progress` / `Removed`.

| Module legacy | État | Notes |
| --- | --- | --- |
| Home view (`#homeView`) | In progress | Migration partielle en cours. |
| Echo hypnose (`#echoHypnoseView`) | In progress | Écran encore rendu côté legacy. |
| Mode selector (`#experienceModeView`) | In progress | Flux multi-room encore en legacy. |
| Guest entry modal (`#guestEntryModal`) | Removed | Markup supprimé du runtime legacy; refs DOM nettoyées. |
| Experience runtime (`#experienceView`) | Not started | Noyau canvas/audio encore legacy. |
| Profile view (`#profileView`) | In progress | Migration UI en cours, dépendances legacy restantes. |
| Bottom nav (`#bottomNav`) | Not started | Navigation encore pilotée par `legacyApp`. |

## Checklist de décommissionnement

- [x] Retirer les sections migrées de `src/features/legacy/runtime/legacyMarkup.html`.
- [x] Simplifier les références dans `src/features/legacy/runtime/domRefs.js`.
- [x] Supprimer les listeners/branches DOM non utilisés (sélecteur modal invité).
- [ ] Mettre à jour l’état de chaque module après chaque PR de migration.

## Fichiers obsolètes candidats à suppression

> Statut = proposition de suppression. Vérifier dans une PR dédiée avec tests avant suppression définitive.

### 1) Suppression immédiate (aucune référence détectée dans `src/`, `tests/`, `docs/`)

- `src/features/multiplayer/session/roomSession.js`
  - Raison: fichier présent mais non importé/référencé dans le code applicatif et les tests.

### 2) Suppression conditionnelle (après migration complète legacy)

- `src/features/legacy/components/LegacyShell.jsx`
- `src/features/legacy/components/LegacyMarkup.jsx`
- `src/features/legacy/components/LegacyRuntimeBootstrap.jsx`
- `src/features/legacy/hooks/useLegacyBootstrap.js`
- `src/features/legacy/runtime/legacyApp.js`
- `src/features/legacy/runtime/legacy.css`
- `src/features/legacy/runtime/legacyMarkup.html`
- `src/features/legacy/runtime/domRefs.js`
  - Raison: toute cette grappe est transitoire et doit disparaître quand les vues `Home/Echo/Profile/Bottom nav/Experience runtime` seront toutes migrées en React natif.

### 3) À consolider (duplication potentielle)

- `src/integrations/supabase/client.js`
  - Raison: simple ré-export de `client/supabaseClient.js`; peut être supprimé si l’équipe choisit un point d’entrée unique et met à jour les imports.
