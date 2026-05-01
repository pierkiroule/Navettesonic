# Soon•° / Navettesonic

**Soon•°** est une application web poétique et sonore permettant de composer une arène d’écoute, puis de la partager par lien.

L’hôte compose une arène avec des bulles sonores.  
Il la publie.  
Il partage un lien.  
N’importe qui peut alors entrer dans cette arène et piloter un petit poisson rose pour écouter la composition à sa façon.

> Composer. Publier. Partager mon arène.  
> Entrer. Piloter son poisson rose. Écouter à sa façon.

---

## Concept

Soon•° n’est pas un multi collaboratif.

C’est une **arène sonore publiée**, visitable par lien.

### Côté hôte

L’hôte peut :

- créer une arène sonore ;
- placer des bulles ;
- choisir les sons ;
- régler les couleurs, tailles, halos et profondeurs ;
- publier l’arène ;
- copier un lien de partage.

### Côté visiteur

Le visiteur peut :

- ouvrir le lien ;
- entrer dans l’arène ;
- piloter son petit poisson rose ;
- explorer librement ;
- écouter la composition selon sa position locale.

Le visiteur ne peut pas :

- créer de bulle ;
- déplacer de bulle ;
- modifier de bulle ;
- supprimer de bulle ;
- écrire dans la base ;
- rejoindre une session live ;
- synchroniser sa position.

Chaque visiteur vit donc une traversée personnelle dans un monde commun.

---

## Flow produit

### Hôte

```txt
Composer mon arène
→ Ajouter et régler les bulles sonores
→ Publier mon arène
→ Copier le lien de partage
```

### Visiteur

```txt
Ouvrir le lien
→ Entrer dans l’arène
→ Piloter le petit poisson rose
→ Écouter à sa façon
```

---

## Lien de partage

Les arènes publiées sont accessibles via une URL de ce type :

https://votre-domaine.fr/?room=ROOMSLUG

Le paramètre room identifie l’arène publiée.

Le code d’invitation peut exister techniquement, mais le parcours principal est le lien direct.

---

## Stack

- React 18
- Vite 5
- Supabase
- Runtime legacy encapsulé dans `src/features/legacy/runtime/`

Aucun Firebase n’est utilisé dans le flow actuel.

---

## Architecture actuelle

```txt
src/
  app/
    App.jsx

  features/
    arena/
      services/
        arenaService.js
      utils/
        roomLink.js
        arenaMappers.js
        guestIdentity.js

    legacy/
      components/
        LegacyShell.jsx
        LegacyMarkup.jsx
        LegacyRuntimeBootstrap.jsx
      hooks/
        useLegacyBootstrap.js
      runtime/
        legacyApp.js
        legacy.css
        legacyMarkup.html

  main.jsx
```

### Fichiers principaux

- `index.html` : shell Vite minimal.
- `src/main.jsx` : point d’entrée React.
- `src/app/App.jsx` : orchestration de l’application.
- `src/features/legacy/components/LegacyShell.jsx` : encapsule l’interface historique.
- `src/features/legacy/runtime/legacyApp.js` : logique historique encore active.
- `src/features/arena/services/arenaService.js` : services Supabase pour les arènes et bulles.
- `src/features/arena/utils/roomLink.js` : génération et lecture des liens `?room=...`.

---

## Architecture cible

Le runtime legacy reste transitoire.

La cible est une application progressivement refactorée en composants React natifs :

```txt
src/
  app/
  features/
    arena/
    auth/
    profile/
    echohypnose/
  integrations/
    supabase/
  shared/
```

Règle projet :

> Toute nouvelle logique doit être ajoutée dans des composants, hooks ou services dédiés, plutôt que dans `legacyApp.js`, sauf correction nécessaire du flow existant.

---

## Modèle arène partagée

Le modèle actuel est volontairement simple.

### Ce que le système fait

- un hôte connecté crée une arène ;
- l’arène est d’abord en brouillon ;
- l’hôte compose les bulles ;
- l’hôte publie l’arène ;
- l’hôte partage un lien ;
- un visiteur anonyme ouvre le lien ;
- le visiteur charge l’arène publiée et ses bulles ;
- le visiteur explore localement avec son poisson rose.

### Ce que le système ne fait pas

- pas de coédition ;
- pas de présence live ;
- pas de participants synchronisés ;
- pas de rôles visiteur ;
- pas de compte visiteur ;
- pas de pseudo obligatoire ;
- pas de Firebase ;
- pas de synchronisation de position ;
- pas d’écriture visiteur.

---

## Tables Supabase actives

Le flow principal utilise uniquement :

- `public.arenas`
- `public.arena_bubbles`

### `public.arenas`

Contient les arènes sonores.

Champs attendus principaux :

- `id`
- `owner_id`
- `invite_code`
- `title`
- `is_active`
- `status`
- `created_at`
- `updated_at`

Statuts recommandés :

- `draft`
- `published`
- `archived`

### `public.arena_bubbles`

Contient les bulles sonores d’une arène.

Champs attendus principaux :

- `id`
- `arena_id`
- `created_by`
- `sample_id`
- `label`
- `x`
- `y`
- `radius`
- `hue`
- `layer`
- `halo_style`
- `version`
- `created_at`
- `updated_at`

---

## Tables legacy ou non utilisées dans le flow principal

Les tables suivantes peuvent exister dans d’anciennes versions, mais ne doivent pas piloter le flow actuel :

- `public.arena_participants`
- `public.arena_guests`
- `public.soon_arenas`
- `public.soon_arena_bubbles`
- `public.soon_arena_invites`
- `public.soon_arena_members`
- `public.soon_arena_presence`

Elles correspondent à d’anciens essais de multi collaboratif, de présence ou d’invitations.

Le flow actuel ne doit pas dépendre de ces tables.

---

## Services d’arène

Le service principal se trouve dans :

`src/features/arena/services/arenaService.js`

Fonctions clés :

- `createHostArena()`
- `publishArena()`
- `archiveArena()`
- `loadPublicArenaByCode()`
- `loadPublicArenaBubbles()`
- `listArenaBubbles()`
- `createArenaBubble()`
- `updateArenaBubble()`
- `deleteArenaBubble()`

### Côté hôte

- `createHostArena()` crée une arène en `draft`.
- `publishArena()` passe l’arène en `published` et retourne le lien de partage.
- `archiveArena()` désactive ou archive l’arène.
- `createArenaBubble()`, `updateArenaBubble()` et `deleteArenaBubble()` gèrent les bulles de l’hôte.

### Côté visiteur

- `loadPublicArenaByCode()` charge une arène publiée depuis `?room=...`.
- `loadPublicArenaBubbles()` charge les bulles associées.
- Aucune écriture n’est effectuée côté visiteur.

---

## RLS Supabase attendues

Les règles Supabase doivent respecter ce principe :

### Visiteur anonyme

Peut lire :

- `arenas` où `is_active = true` et `status = 'published'`
- `arena_bubbles` liées à une arène publiée

Ne peut jamais :

- `insert`
- `update`
- `delete`

### Hôte authentifié

Peut gérer :

- ses propres arènes
- les bulles de ses propres arènes

---

## Exemple de politiques RLS

```sql
ALTER TABLE public.arenas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_bubbles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS arenas_public_read_published ON public.arenas;

CREATE POLICY arenas_public_read_published
ON public.arenas
FOR SELECT
TO anon
USING (
  is_active = true
  AND status = 'published'
);

DROP POLICY IF EXISTS arena_bubbles_public_read_published ON public.arena_bubbles;

CREATE POLICY arena_bubbles_public_read_published
ON public.arena_bubbles
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1
    FROM public.arenas
    WHERE arenas.id = arena_bubbles.arena_id
      AND arenas.is_active = true
      AND arenas.status = 'published'
  )
);

DROP POLICY IF EXISTS arenas_owner_all ON public.arenas;

CREATE POLICY arenas_owner_all
ON public.arenas
FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS arena_bubbles_owner_all ON public.arena_bubbles;

CREATE POLICY arena_bubbles_owner_all
ON public.arena_bubbles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.arenas
    WHERE arenas.id = arena_bubbles.arena_id
      AND arenas.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.arenas
    WHERE arenas.id = arena_bubbles.arena_id
      AND arenas.owner_id = auth.uid()
  )
);
```

---

## Variables d’environnement

Créer un fichier `.env.local` :

```bash
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon
```

Selon le code existant, la clé peut aussi être lue via :

```bash
VITE_SUPABASE_PUBLISHABLE_KEY=votre-cle-publishable
```

---

## Démarrage local

```bash
npm install
npm run dev
```

---

## Build production

```bash
npm run build
npm run preview
```

---

## Tests

```bash
npm test
```

---

## Connexion Supabase via GitHub Actions

Le workflow :

`.github/workflows/supabase-db-push.yml`

permet de piloter les migrations Supabase depuis GitHub Actions.

### Secrets GitHub requis

Dans `Settings → Secrets and variables → Actions`, ajouter :

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_ID`
- `SUPABASE_DB_PASSWORD`

### Exécution

- automatique sur push vers `main` quand `supabase/**` change ;
- manuelle via **Run workflow** avec option `dry_run=true`.

### Vérification attendue

Le job valide les secrets, puis exécute :

```bash
supabase link --project-ref ...
supabase migration list
supabase db push
```

---

## Déploiement Vercel

Procédure manuelle :

```bash
supabase link --project-ref <SUPABASE_PROJECT_ID>
supabase db push

vercel --prod
```

Recommandation :

> Pousser les migrations Supabase avant le déploiement Vercel, afin que le schéma soit à jour au runtime.

---

## Notes de consolidation

Le code legacy a été regroupé dans :

`src/features/legacy/`

Objectifs :

1. conserver l’expérience existante ;
2. isoler l’ancien runtime ;
3. permettre un refactor incrémental ;
4. éviter de reconstruire toute l’application d’un coup.

---

## Roadmap courte

### V1

- Composer une arène.
- Publier une arène.
- Copier un lien.
- Ouvrir l’arène sans compte.
- Explorer en lecture seule.
- Écouter en binaural local.

### V2 possible

- meilleure interface React native ;
- bibliothèque d’arènes publiées ;
- duplication d’arènes ;
- sauvegarde de parcours personnels ;
- export d’une composition ;
- packs sonores ;
- modes thérapeutiques / pédagogiques.

---

## Phrase produit

Soon•° permet de composer une arène sonore poétique et de la partager par lien. Chaque visiteur y pilote son petit poisson rose et écoute la composition à sa façon.
