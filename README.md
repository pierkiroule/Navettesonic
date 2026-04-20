# Navettesonic

## Repository policy

To avoid CI/review issues with unsupported binary diffs, do not add new binary assets directly to Git (videos/images) unless explicitly requested. Existing tracked demo assets are kept as-is.

## Supabase setup (CLI + Vercel)

Le projet est prêt pour un workflow Supabase sans exposer de secrets dans Git.

### 1) Authentification et lien du projet Supabase

Depuis la racine du repo :

```bash
supabase login
supabase init
supabase link --project-ref qyffktrggapfzlmmlerq
```

> `supabase init` va créer le dossier `supabase/` (config locale).

### 2) Variables d'environnement locales

Copiez le template :

```bash
cp .env.example .env.local
```

Puis renseignez les valeurs réelles dans `.env.local` (notamment le mot de passe DB).

### 3) Variables d'environnement Vercel

Ajoutez les mêmes variables dans **Vercel → Project Settings → Environment Variables** :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_URL`

### 4) Bucket Storage (Soonbucket)

Le profil inclut maintenant une carte “Supabase Storage · Soonbucket” qui permet :

- de tester la connexion Supabase avec URL + clé publishable ;
- d’uploader un fichier vers le bucket `Soonbucket` ;
- d’obtenir l’URL publique générée.

> La config est stockée en local dans le navigateur (localStorage), pas dans le repo.

### 5) Auth + Session + Store (simulation)

La vue Profil contient aussi :

- un bloc **Auth Supabase** (email/password) avec restauration de session ;
- un **store audio** avec paiement simulé (*activation gratuite temporaire*) ;
- une **collection utilisateur** qui tente de charger les previews audio depuis `Soonbucket`.

### 6) Sécurité

- Ne jamais commiter `.env` / `.env.local`.
- La clé *publishable* peut être publique côté front, mais les secrets DB restent côté serveur.
