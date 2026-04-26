# Migration UI — Navigation simplifiée (FAB + menu radial)

## Avant
- Barre de navigation basse multi-boutons (`Accueil`, `Soon`, `Échohypnose`, `Profil`).
- Boutons persistants supplémentaires en haut (`Tracer l'écoute`, `Le silence des yeux`).
- Multiplication des points d'entrée visibles en permanence.

## Après
- Un **seul bouton flottant principal** (FAB) ancré bas écran (mobile-first).
- Tap FAB => menu radial (actions fréquentes): `Accueil`, `Soon`, `Écho`, `Profil`, `Plus`.
- `Plus` ouvre un mini sheet avec actions rares: `Tracer l'écoute`, `Silence des yeux`.
- Fermeture du menu: tap extérieur, retour navigateur, sélection d'action.

## Décisions UX
1. **Découvrabilité prioritaire**: ouverture au tap (aucun long press requis).
2. **Long press optionnel**: 500ms uniquement pour déplacer le FAB.
3. **Réduction de charge cognitive**: les anciens contrôles redondants sont masqués.
4. **Robustesse**: état occupé (`loading`) bloque les double taps.
5. **Accessibilité minimale**: boutons ≥44px, labels icône+texte, `aria-expanded`, `aria-live`.

## Compatibilité
- Les flows existants sont conservés (les actions réutilisent la logique en place: `showView`, enregistrement, tracé).
- Position du FAB persistée en `localStorage`.
