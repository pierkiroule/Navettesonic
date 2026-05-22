# ÉchoStory MVP (texte)

## Concept
ÉchoStory est un mode expérimental parallèle à Compo/Navigo.
Le cœur du MVP : cueillir des étoiles textuelles en 3 vagues (Immersion, Bascule, Ouverture), puis transformer la récolte en histoire courte à partir d’un tracé Navigo/Odysseo.

## Flow utilisateur
1. Passer en mode `echostory`.
2. Cueillir les étoiles de la vague active (5/5) pour débloquer la suivante.
3. Terminer les 3 vagues (max 15 fragments collectés).
4. Tracer un parcours en Navigo/Odysseo.
5. Cliquer sur **Générer ÉchoStory texte**.
6. Lire le résultat texte (cues + fragments + pauses visuelles).

Résumé MVP : **ÉchoStory = cueillir 3 vagues d’étoiles → tracer → générer une histoire texte.**

## Fichiers ajoutés (MVP)
- `src/data/echostoryFragments.js` : banque de fragments par vague.
- `src/data/echostorySkeletons.js` : squelettes de cues d’amorce.
- `src/core/echostory/echostoryEngine.js` : génération d’étoiles, collecte, progression de vagues, reset.
- `src/core/echostory/echostoryRender.js` : rendu visuel des étoiles (halo pulsant).
- `src/core/echostory/echostoryBuilder.js` : génération texte à partir des étoiles + tracé.
- `src/store/slices/echostorySlice.js` : actions store ÉchoStory.
- `tests/echostoryEngine.test.mjs` : tests moteur de cueillette.
- `tests/echostoryBuilder.test.mjs` : tests génération texte.

## Limites actuelles
- MVP texte uniquement (pas d’audio, pas de TTS, pas d’IA externe).
- Overlay de cinématique « sortir du bocal mental » minimal (états + texte doux), sans physique membrane dédiée.
- Génération texte déterministe/simple : sélection par vagues + cues + pauses (`...` / `— silence —`).
- UX encore utilitaire (panneaux techniques), sans design narratif avancé.

## Prochaines étapes audio (sans casser l’existant lucioles)
- Ajouter une couche d’ambiances sonores **optionnelle** dédiée ÉchoStory (non bloquante).
- Mapper chaque vague vers une texture audio légère (immersion/bascule/ouverture).
- Synchroniser des micro-événements audio discrets avec cues/pauses du texte.
- Garder une séparation stricte avec le système lucioles/firefly existant.
- Prévoir un toggle global pour activer/désactiver l’audio ÉchoStory en test.
