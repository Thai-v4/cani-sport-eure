# Site Web Cani-Sports Eure

Site officiel de l'association Cani-Sports Eure (CS27) : vitrine publique, espace adhérents et outils du bureau.

## 💻 Stack

- **Framework** : [Next.js 16](https://nextjs.org/) (App Router, Turbopack) · React 19
- **Données, authentification, fichiers** : [Supabase](https://supabase.com/)
- **Agenda** : Google Agenda via un compte de service
- **Styles** : [Tailwind CSS 4](https://tailwindcss.com/) + [daisyUI 5](https://daisyui.com/)
- **Hébergement** : [Vercel](https://vercel.com/)

## 🧞 Commandes

| Commande               | Action                                          |
| :--------------------- | :---------------------------------------------- |
| `npm install`          | Installe les dépendances                        |
| `npm run dev`          | Serveur de développement sur `localhost:3000`   |
| `npm run build`        | Build de production                             |
| `npm run start`        | Sert le build de production                     |
| `npm run lint`         | ESLint                                          |
| `npm run typecheck`    | Vérification TypeScript                         |
| `npm run format`       | Formate le code avec Prettier                   |
| `npm run cz`           | Commit guidé (commitizen)                       |

Copier `.env.example` en `.env.local` et renseigner les valeurs avant `npm run dev`.

## 📁 Organisation

- `app/` : pages (App Router), composants (`app/components/`) et routes API (`app/api/`)
- `lib/` : client Supabase navigateur, client serveur (`lib/supabase/server.ts`), rôles (`lib/roles.ts`)
- `proxy.ts` : contrôle d'accès côté serveur aux pages adhérents et administrateur
- `supabase/migrations/` : scripts SQL (rôles, règles RLS, stockage)
- `public/` : images, logos, pictogrammes

## 🔐 Sécurité

- **Rôles** : `administrateur`, `animateur`, `comptable` et `statut_inscription` sont lus dans
  `app_metadata` (modifiable uniquement avec la clé service), jamais dans `user_metadata`
  que chaque utilisateur peut réécrire lui-même.
- **Données** : la protection réelle repose sur les règles RLS Supabase
  (`supabase/migrations/20260930120000_securite_roles_rls.sql`). Le proxy et les gardes
  d'interface ne font qu'éviter d'afficher des écrans inaccessibles.
- **Routes API** : `/api/users` et l'écriture dans `/api/calendar` exigent un administrateur ;
  les événements privés ne sont servis qu'aux adhérents validés.
- **Clé service** : uniquement dans les routes `app/api/`, jamais dans le code client.

### Mise en production de la migration de sécurité

1. Relire puis exécuter `supabase/migrations/20260930120000_securite_roles_rls.sql`
   (éditeur SQL Supabase ou `supabase db push`).
2. Déployer immédiatement le code correspondant.
3. Supprimer l'ancienne fonction Edge devenue inutile : `supabase functions delete validate-signup`.
4. Retirer les anciens rôles de `user_metadata` (requête fournie en commentaire dans la migration).
5. Supprimer de Vercel les variables devenues inutiles : `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
   `GOOGLE_ACCESS_TOKEN`, `NEXTAUTH_*`.
