-- ════════════════════════════════════════════════════════════════════════════
-- Durcissement appliqué en production le 2026-10-26 (consigné ici après coup)
-- ════════════════════════════════════════════════════════════════════════════
-- 1. PostGIS sort du schéma public : spatial_ref_sys (propriétaire
--    supabase_admin, donc impossible à protéger par RLS) n'est plus exposée
--    par l'API REST. L'extension n'étant pas déplaçable, on la recrée.
--    ⚠ Supprime la colonne gpx_tracks.geom : on la sauvegarde en texte et on
--    la recharge dans la même transaction.
-- 2. Le déclencheur interne rls_auto_enable() n'est plus appelable via l'API.
-- 3. search_path fixé sur les fonctions publiques.
-- 4. Retrait de TRUNCATE / REFERENCES / TRIGGER à anon et authenticated
--    (TRUNCATE contourne la RLS), y compris pour les futures tables.
-- Idempotent sauf l'étape 1, qui ne doit être jouée qu'une fois.
-- ════════════════════════════════════════════════════════════════════════════

begin;

-- ─── 1. PostGIS dans le schéma extensions ───────────────────────────────────
do $$
begin
  if (select n.nspname from pg_extension e join pg_namespace n on n.oid = e.extnamespace
      where e.extname = 'postgis') = 'public' then
    create temp table sauv_geom on commit drop as
      select id, st_asewkt(geom) as ewkt from public.gpx_tracks;
    drop extension postgis cascade;
    create extension postgis schema extensions;
    alter table public.gpx_tracks add column geom extensions.geometry(LineStringZ, 4326);
    update public.gpx_tracks t
      set geom = extensions.st_geomfromewkt(s.ewkt)
      from sauv_geom s where s.id = t.id;
  end if;
end;
$$;

-- ─── 2. Déclencheur interne non appelable via /rest/v1/rpc ──────────────────
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- ─── 3. search_path fixé ────────────────────────────────────────────────────
alter function public.get_gpx_tracks_geojson() set search_path = public, extensions;
alter function public.get_files_in_bucket(text) set search_path = '';
alter function public.test_auth_uid() set search_path = '';

-- ─── 4. Droits hérités trop larges ──────────────────────────────────────────
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;
alter default privileges in schema public
  revoke truncate, references, trigger on tables from anon, authenticated;

commit;
