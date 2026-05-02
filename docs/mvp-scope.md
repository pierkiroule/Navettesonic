# MVP Scope

Ce document définit le périmètre fonctionnel MVP et la checklist de validation associée.
Il sert de référence pour toutes les futures PR.

## Décisions produit

**Date de gel : 2026-05-02**

- MVP officiel = **modèle publié en lecture seule**.
- Le visiteur consulte une version publiée, avec exploration locale uniquement.
- **Pas de synchronisation live** (ni présence, ni suivi temps réel hôte/visiteurs).
- **Pas de pseudo obligatoire** à l'entrée visiteur.
- Les documents de référence (README et `docs/mvp-flow.md`) doivent rester alignés sur ces décisions.

## Parcours hôte (in scope)

Objectif : permettre à un hôte de préparer et diffuser une arène consultable.

1. **Créer une arène**
   - L’hôte peut créer une nouvelle arène.
   - Une arène nouvellement créée est modifiable par l’hôte.

2. **Éditer les bulles**
   - L’hôte peut ajouter, modifier et supprimer des bulles.
   - Les changements sont persistés pour l’arène concernée.

3. **Publier l’arène**
   - L’hôte peut publier une arène afin de la rendre accessible en lecture.
   - L’état publié représente une version exploitable par les visiteurs.

4. **Partager le lien**
   - L’hôte obtient un lien de partage vers l’arène publiée.
   - Ce lien peut être transmis à des visiteurs pour consultation.

## Parcours visiteur (in scope)

Objectif : permettre à un visiteur de consulter une arène publiée sans édition collaborative.

1. **Ouvrir le lien**
   - Le visiteur ouvre le lien partagé par l’hôte.

2. **Charger l’arène publiée**
   - L’application charge les données de l’arène en état publié.
   - Le visiteur accède au contenu publié.

3. **Explorer localement**
   - Le visiteur peut naviguer/explorer l’arène côté client.
   - Cette exploration n’implique pas de synchronisation temps réel avec d’autres utilisateurs.

## Hors périmètre explicite (out of scope)

Les éléments suivants sont explicitement exclus du MVP :

- **Coédition** (édition simultanée multi-utilisateur).
- **Présence live** (indication des utilisateurs connectés en temps réel).
- **Synchronisation de position** (partage en direct de la position/caméra entre utilisateurs).
- **Écriture visiteur** (création/modification/suppression par un visiteur).
- **Rôles visiteur** (gestion avancée des permissions côté visiteur).

## Definition of Done (DoD) — Checklist PR obligatoire

Cette checklist doit être utilisée pour **toutes les futures PR** liées à ce périmètre.

- [ ] Le changement contribue clairement à l’un des parcours **in scope** (hôte ou visiteur).
- [ ] Le changement n’introduit aucun élément **out of scope** listé dans ce document.
- [ ] Le parcours hôte concerné reste fonctionnel : créer arène, éditer bulles, publier, partager lien.
- [ ] Le parcours visiteur concerné reste fonctionnel : ouvrir lien, charger arène publiée, explorer localement.
- [ ] Les cas d’erreur minimaux (chargement impossible, arène non publiée, lien invalide) sont traités ou documentés.
- [ ] Les impacts UX sont cohérents avec un mode visiteur en lecture seule.
- [ ] Les tests (automatisés ou manuels) couvrant le changement sont décrits dans la PR.
- [ ] La PR mentionne explicitement ce document (`docs/mvp-scope.md`) comme référence de périmètre.
