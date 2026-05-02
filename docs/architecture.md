# Architecture applicative

## Arborescence cible

- `src/app/`: bootstrap de l'app, composition des providers globaux, routing.
- `src/features/arena/`: UI, hooks et services métier de l'arène.
- `src/features/auth/`: squelette de la feature authentification.
- `src/features/profile/`: squelette de la feature profil utilisateur.
- `src/features/echohypnose/`: squelette de la feature Echohypnose.
- `src/integrations/supabase/`: client Supabase et repositories d'accès données.
- `src/shared/`: composants UI partagés, utilitaires, constantes transverses.

## Règle d'import

Règle de dépendances à respecter:

1. `app` peut importer depuis `features`, `shared` et `integrations`.
2. Une `feature` peut importer depuis `shared` et `integrations`.
3. Une `feature` ne doit pas importer une autre `feature` directement.
4. `shared` ne dépend d'aucune `feature`.
5. `integrations` ne dépend d'aucune `feature`.

En notation simplifiée:

- `app -> features | shared | integrations`
- `features -> shared | integrations`
- `shared -> (aucune feature)`
- `integrations -> (aucune feature)`
