-- ============================================================
-- 05 · fix_admin_stats_group_by
-- Estadísticas del panel (versión corregida: agrupa sin ambigüedad).
-- ============================================================
create or replace function public.admin_stats(p_key text, p_dias int default 30)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare r jsonb; desde timestamptz := now() - make_interval(days => greatest(1, least(p_dias, 365)));
begin
  perform private.require_admin(p_key);
  select jsonb_build_object(
    'vistas', (select count(*) from public.visitas where evento='vista' and created_at >= desde),
    'visitantes', (select count(distinct sid) from public.visitas where created_at >= desde),
    'whatsapp', (select count(*) from public.visitas where evento='whatsapp' and created_at >= desde),
    'brief_inicio', (select count(*) from public.visitas where evento='brief_inicio' and created_at >= desde),
    'brief_envio', (select count(*) from public.visitas where evento='brief_envio' and created_at >= desde),
    'por_dia', coalesce((select jsonb_agg(jsonb_build_object('d', d, 'n', n) order by d) from (
        select to_char(created_at at time zone 'America/El_Salvador','YYYY-MM-DD') d, count(*) n
        from public.visitas where evento='vista' and created_at >= desde
        group by to_char(created_at at time zone 'America/El_Salvador','YYYY-MM-DD')) s), '[]'::jsonb),
    'por_pagina', coalesce((select jsonb_agg(jsonb_build_object('p', p, 'n', n) order by n desc) from (
        select path p, count(*) n from public.visitas
        where evento='vista' and created_at >= desde group by path order by count(*) desc limit 12) s), '[]'::jsonb),
    'dispositivos', coalesce((select jsonb_object_agg(device, n) from (
        select device, count(*) n from public.visitas where created_at >= desde and device is not null group by device) s), '{}'::jsonb),
    'origenes', coalesce((select jsonb_agg(jsonb_build_object('r', r, 'n', n) order by n desc) from (
        select coalesce(nullif(ref,''),'directo') r, count(*) n from public.visitas
        where evento='vista' and created_at >= desde group by coalesce(nullif(ref,''),'directo') order by count(*) desc limit 8) s), '[]'::jsonb)
  ) into r;
  return r;
end $$;
