# MVP Flow

Ce flux officiel cible un **modèle publié en lecture seule, sans synchronisation live**.

## Parcours hôte (MVP)

1. L'hôte arrive sur l'éditeur d'arène.
2. Il compose son arène (ajout, édition, suppression de bulles).
3. Il publie l'arène.
4. Il copie puis partage le lien visiteur de l'arène publiée.

## Parcours visiteur (MVP)

1. Le visiteur ouvre le lien partagé.
2. L'application charge l'arène publiée.
3. Le visiteur consulte le contenu en lecture seule.
4. Le visiteur explore localement (navigation personnelle côté client).

## Contraintes produit (MVP)

- Aucun pseudo obligatoire à l'entrée.
- Aucune présence live (pas de liste de visiteurs connectés en temps réel).
- Aucun suivi temps réel de l'hôte (pas de caméra/position partagée en direct).
- Aucune écriture côté visiteur (création/modification/suppression interdites).
