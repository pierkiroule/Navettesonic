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
