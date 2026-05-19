# Notes dev — labybulle

## Hypothèses explicites

- Les transitions de portail sont d'abord intégrées au modèle de monde (`WorldGraph`) et au rendu des trous, sans imposer de nouveau flow UX obligatoire (clic/touch de trou) dans ce patch.
- Le spawn de Soon au centre est matérialisé par `startPosition = { x: 0, y: 0 }` et par reset du poisson au centre lors d'un changement d'arène.
- Les portails sont modélisés comme paires explicites unidirectionnelles (`bidirectional: false`) pour simplifier la validation et éviter les ambiguïtés de sens.
