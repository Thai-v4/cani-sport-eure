-- ════════════════════════════════════════════════════════════════════════════
-- Sécurité : rôles dans app_metadata + règles RLS sur les tables et le stockage
-- ════════════════════════════════════════════════════════════════════════════
-- À APPLIQUER AVANT DE DÉPLOYER le code qui lit les rôles dans app_metadata,
-- sinon les administrateurs actuels perdront leur accès. Attention : la version
-- actuellement en ligne écrit avec un client sans session sur certains écrans
-- d'admin ; ces écritures seront refusées dès l'application des règles, d'où
-- l'intérêt de déployer le nouveau code juste après.
--
-- Ce script :
--   1. copie administrateur / animateur / comptable / statut_inscription de
--      user_metadata (modifiable par l'utilisateur lui-même) vers app_metadata
--      (modifiable uniquement avec la clé service) ;
--   2. crée les fonctions est_admin(), est_adherent(), est_comptable() ;
--   3. SUPPRIME TOUTES les règles RLS existantes des tables listées et de
--      storage.objects, puis recrée des règles fondées sur ces rôles ;
--   4. rend privé le bucket « club-documents » (téléchargement par URL signée).
--
-- Relire avant exécution (éditeur SQL Supabase ou `supabase db push`).
-- Après exécution, chaque utilisateur doit se reconnecter (ou attendre le
-- rafraîchissement de son jeton) pour que ses rôles soient pris en compte.
-- ════════════════════════════════════════════════════════════════════════════

begin;

-- ─── 1. Migration des rôles ─────────────────────────────────────────────────
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
  'administrateur', coalesce(raw_user_meta_data ->> 'administrateur' in ('true', 't'), false),
  'animateur',      coalesce(raw_user_meta_data ->> 'animateur' in ('true', 't'), false),
  'comptable',      coalesce(raw_user_meta_data ->> 'comptable' in ('true', 't'), false),
  'statut_inscription', coalesce(raw_user_meta_data ->> 'statut_inscription', 'en attente')
)
where not (coalesce(raw_app_meta_data, '{}'::jsonb) ? 'statut_inscription');

-- Les anciennes copies restent dans user_metadata pour que la version en ligne
-- continue de fonctionner jusqu'au déploiement. Une fois le nouveau code en
-- production, les retirer (le code ne les lit plus) :
--
--   update auth.users
--   set raw_user_meta_data = raw_user_meta_data - 'administrateur' - 'animateur' - 'comptable' - 'statut_inscription'
--   where raw_user_meta_data ?| array['administrateur', 'animateur', 'comptable', 'statut_inscription'];

-- ─── 2. Fonctions de rôle (lisent le jeton de l'appelant) ───────────────────
create or replace function public.est_admin() returns boolean
language sql stable set search_path = '' as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'administrateur')::boolean, false)
$$;

create or replace function public.est_adherent() returns boolean
language sql stable set search_path = '' as $$
  select public.est_admin()
      or coalesce(auth.jwt() -> 'app_metadata' ->> 'statut_inscription', '') = 'inscrit'
$$;

create or replace function public.est_comptable() returns boolean
language sql stable set search_path = '' as $$
  select public.est_admin()
     and coalesce((auth.jwt() -> 'app_metadata' ->> 'comptable')::boolean, false)
$$;

-- ─── 3. Règles RLS des tables ───────────────────────────────────────────────
-- Applique un jeu de règles à une table si elle existe : active la RLS,
-- supprime toutes ses règles existantes, puis crée lecture / écriture.
create or replace function pg_temp.proteger(
  nom_table text,
  lecture text,           -- condition USING pour SELECT
  ecriture text           -- condition USING / WITH CHECK pour INSERT, UPDATE, DELETE
) returns void language plpgsql as $$
declare
  r record;
begin
  if to_regclass(format('public.%I', nom_table)) is null then
    raise notice 'Table % absente : ignorée', nom_table;
    return;
  end if;

  execute format('alter table public.%I enable row level security', nom_table);

  for r in select policyname from pg_policies where schemaname = 'public' and tablename = nom_table loop
    execute format('drop policy %I on public.%I', r.policyname, nom_table);
  end loop;

  execute format('create policy lecture on public.%I for select using (%s)', nom_table, lecture);
  execute format('create policy ajout on public.%I for insert with check (%s)', nom_table, ecriture);
  execute format('create policy modification on public.%I for update using (%s) with check (%s)', nom_table, ecriture, ecriture);
  execute format('create policy suppression on public.%I for delete using (%s)', nom_table, ecriture);
end;
$$;

-- Profils : chacun gère le sien ; les adhérents voient les autres (noms dans les résultats)
select pg_temp.proteger('profils',
  'id = (select auth.uid()) or public.est_adherent()',
  'id = (select auth.uid()) or public.est_admin()');

-- Chiens : visibles et modifiables par leur propriétaire et le bureau
select pg_temp.proteger('chiens',
  'id_profil = (select auth.uid()) or public.est_admin()',
  'id_profil = (select auth.uid()) or public.est_admin()');

-- Participations : celles de l'adhérent, et toutes pour le bureau
select pg_temp.proteger('participation',
  'id_profil = (select auth.uid()) or public.est_admin()',
  'id_profil = (select auth.uid()) or public.est_admin()');

-- Contenus publics, publiés par le bureau
select pg_temp.proteger('publication', 'true', 'public.est_admin()');
select pg_temp.proteger('gpx_tracks', 'true', 'public.est_admin()');
select pg_temp.proteger('categorieResultat', 'true', 'public.est_admin()');
select pg_temp.proteger('resultatType', 'true', 'public.est_admin()');

-- Événements : les événements internes sont réservés aux adhérents
select pg_temp.proteger('evenements',
  'type is distinct from ''interne'' or public.est_adherent()',
  'public.est_admin()');

-- Résultats : réservés aux adhérents
select pg_temp.proteger('resultats', 'public.est_adherent()', 'public.est_admin()');

-- Documents du club : selon leur niveau d'accès
select pg_temp.proteger('club_documents',
  'access_level = ''public''
     or (access_level = ''adherent'' and public.est_adherent())
     or (access_level = ''admin'' and public.est_admin())
     or (access_level = ''admin_comptable'' and public.est_comptable())',
  'public.est_admin()');

-- Tables du tableau de bord administrateur
select pg_temp.proteger('evenement', 'public.est_admin()', 'public.est_admin()');
select pg_temp.proteger('performance', 'public.est_admin()', 'public.est_admin()');
select pg_temp.proteger('results', 'public.est_admin()', 'public.est_admin()');
select pg_temp.proteger('stats', 'public.est_admin()', 'public.est_admin()');

-- Vue publique des auteurs (nom, prénom, photo) pour les pages visibles sans compte :
-- n'expose ni email, ni date de naissance, ni licence.
create or replace view public.profils_publics as
  select id, nom, prenom, photo_profil from public.profils;
revoke all on public.profils_publics from anon, authenticated;
grant select on public.profils_publics to anon, authenticated;

-- ─── 4. Stockage ────────────────────────────────────────────────────────────
update storage.buckets set public = false where id = 'club-documents';

do $$
declare
  r record;
begin
  for r in select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects' loop
    execute format('drop policy %I on storage.objects', r.policyname);
  end loop;
end;
$$;

-- images : illustrations d'articles et d'événements (bureau), photos de profil (adhérents)
create policy "images lecture" on storage.objects for select
  using (bucket_id = 'images');
create policy "images ajout" on storage.objects for insert
  with check (bucket_id = 'images' and (public.est_admin() or (public.est_adherent() and name like 'profils/%')));
create policy "images modification" on storage.objects for update
  using (bucket_id = 'images' and (public.est_admin() or owner_id = (select auth.uid()::text)));
create policy "images suppression" on storage.objects for delete
  using (bucket_id = 'images' and (public.est_admin() or owner_id = (select auth.uid()::text)));

-- photo : albums du club, réservés aux adhérents, alimentés par le bureau
create policy "photo lecture" on storage.objects for select
  using (bucket_id = 'photo' and public.est_adherent());
create policy "photo ajout" on storage.objects for insert
  with check (bucket_id = 'photo' and public.est_admin());
create policy "photo modification" on storage.objects for update
  using (bucket_id = 'photo' and public.est_admin());
create policy "photo suppression" on storage.objects for delete
  using (bucket_id = 'photo' and public.est_admin());

-- gpx-files : traces des sorties, téléchargeables par tous, déposées par le bureau
create policy "gpx lecture" on storage.objects for select
  using (bucket_id = 'gpx-files');
create policy "gpx ajout" on storage.objects for insert
  with check (bucket_id = 'gpx-files' and public.est_admin());
create policy "gpx modification" on storage.objects for update
  using (bucket_id = 'gpx-files' and public.est_admin());
create policy "gpx suppression" on storage.objects for delete
  using (bucket_id = 'gpx-files' and public.est_admin());

-- club-documents : lecture si la ligne correspondante de club_documents est visible
-- (la RLS de club_documents ci-dessus s'applique dans la sous-requête)
create policy "documents lecture" on storage.objects for select
  using (
    bucket_id = 'club-documents'
    and exists (
      select 1 from public.club_documents d
      where right(d.file_url, length(storage.objects.name) + 1) = '/' || storage.objects.name
    )
  );
create policy "documents ajout" on storage.objects for insert
  with check (bucket_id = 'club-documents' and public.est_admin());
create policy "documents modification" on storage.objects for update
  using (bucket_id = 'club-documents' and public.est_admin());
create policy "documents suppression" on storage.objects for delete
  using (bucket_id = 'club-documents' and public.est_admin());

commit;
