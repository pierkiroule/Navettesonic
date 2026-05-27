# Soon — Proposition d’UI « one view » pour l’échohypnose

## Objectif
Concevoir une interface **en une seule vue** qui conserve le cœur de l’expérience :
- explorer une arène-bulle,
- cueillir bulles musicales + étoiles vocales,
- structurer une **traîne** qui devient un script de séance d’échohypnose.

Cette proposition s’appuie sur le flow déjà présent dans Soon (Compo → Tracer → Lire), mais l’unifie sans changer de page ni de mode principal.

---

## Analyse du flow existant

## 1) Ce qui marche déjà très bien
- Le produit a déjà un **triptyque clair** : composer / tracer / lire.
- L’arène immersive existe (canvas), avec logique de collecte et de navigation.
- Le moteur ÉchoStory fournit déjà une progression en vagues et une construction narrative.

## 2) Frictions actuelles
- La séparation des modes (Compo/Navigo) peut être vécue comme une rupture de continuité mentale.
- Les panneaux/outils techniques demandent de « comprendre l’outil » avant de « vivre l’expérience ».
- La construction de la traîne (ordre + intention) n’est pas toujours lisible en temps réel pendant l’exploration.

## 3) Enjeu UX principal
Transformer un workflow à états techniques en **rituel continu** :
**Explorer → Cueillir → Ordonner → Souffler la séance**
…sans quitter la même scène.

---

## Principe de la one view

## Métaphore centrale
Une **scène unique** avec 3 couches visibles simultanément :
1. **Arène** (centre, 70% de l’attention) : exploration libre.
2. **Traîne vivante** (bas/latéral, 20%) : éléments cueillis qui s’alignent dans l’ordre narratif.
3. **Souffle de séance** (micro-panneau discret, 10%) : feedback contextuel + action « Générer/Lire ».

L’utilisateur ne change pas de vue, il change de **focus** dans la même vue.

---

## Architecture UI proposée

## A. Zone centrale : Arène-bulle immersive
- Plein écran comme surface primaire.
- Bulles musicales et étoiles vocales coexistent visuellement.
- Indices doux de progression (halo, pulsation, traînée lumineuse) plutôt que widgets denses.

### Interactions clés
- Tap/clic sur bulle = écouter/apercevoir.
- Glisser vers soi ou double-tap = cueillir dans la traîne.
- Maintien long sur élément cueilli = choisir sa « couleur d’intention » (immersion, bascule, ouverture).

## B. Dock de traîne (toujours visible)
- Bande flottante en bas (ou latérale sur desktop).
- Chaque item cueilli devient une perle (icône + type + durée).
- Drag & drop simple pour ordonner.
- Groupes visuels par phase de séance :
  - Immersion
  - Bascule
  - Ouverture

### Effet UX recherché
La traîne donne immédiatement le sentiment de « composer un protocole vivant » au lieu d’accumuler des assets.

## C. Panneau souffle (compact, contextuel)
- Affiche 3 infos max :
  - état de collecte,
  - cohérence de la traîne,
  - readiness de génération.
- CTA unique évolutif :
  - « Continuer l’exploration »
  - « Structurer la traîne »
  - « Lancer la séance »

Pas de formulaire complexe : guidance pas-à-pas, sans sortir de la scène.

---

## Flow utilisateur unifié (one view)

1. **Entrée dans l’arène**
   - courte amorce poétique + consigne gestuelle minimale.

2. **Exploration sensible**
   - Soon nage/explore ; l’utilisateur écoute et ressent.

3. **Cueillette**
   - chaque bulle/étoile cueillie descend dans la traîne.

4. **Structuration directe**
   - l’utilisateur réorganise la traîne à la volée (drag & drop).
   - micro-tags d’intention pour équilibrer immersion/bascule/ouverture.

5. **Validation douce**
   - le panneau souffle confirme : « ta séance est respirable ».

6. **Génération / lecture**
   - script échohypnose généré sans changement d’écran.
   - lecture synchronisée (texte + repères audio) au-dessus de l’arène.

---

## Règles produit (pour garder l’expérience poétique)
- **Une action principale à la fois** (cueillir OU ordonner OU lancer).
- **Feedback sensoriel avant feedback technique**.
- **Limiter la densité textuelle** dans l’UI ; privilégier signaux visuels/sonores.
- **Tolérance au non-linéaire** : l’utilisateur peut explorer longtemps avant de structurer.

---

## Mapping sur l’existant (sans refonte lourde)
- Conserver le canvas et les moteurs actuels.
- Réduire le switch explicite Compo/Navigo en « focus traîne » dans la même vue.
- Transformer le panneau latéral en panneau souffle compact.
- Réutiliser la logique ÉchoStory (vagues) comme **guidage implicite** de la traîne.
- Conserver l’export/génération, mais exposer un seul CTA final contextuel.

---

## Wireframe textuel (mobile-first)

- **Header minimal** : respiration / état global.
- **Centre** : arène interactive.
- **Bas sticky** : traîne (scroll horizontal des perles).
- **Coin inférieur droit** : bouton principal contextuel.
- **Sheet optionnelle** : édition fine d’une perle (durée, intention, silence).

---

## KPIs UX à suivre
- Temps avant première cueillette.
- Nombre moyen d’éléments dans la traîne avant génération.
- Taux de génération de séance après cueillette initiale.
- Nombre de réordonnancements (proxy de créativité vs friction).
- Taux de retour en exploration après structuration.

---


## Ajustement immédiat demandé

Avant toute mise en place one-view complète, on simplifie le flow en **retirant le mode tracé explicite** de l’interface.
- Plus de bascule utilisateur vers un mode « plume/tracé ».
- L’exploration reste centrée sur la manipulation des bulles/étoiles dans une logique unique.
- La structuration narrative doit être portée par la traîne et le CTA contextuel, pas par un changement de mode.

## Décision recommandée
Adopter un **MVP one view incrémental** :
1. Ajouter le dock de traîne persistant.
2. Unifier le CTA de progression en panneau souffle compact.
3. Garder la logique moteur actuelle, sans refaire l’architecture.

Cela maximise la cohérence avec le concept d’échohypnose : une expérience continue, organique et poétique, où la séance naît d’une exploration incarnée.
