-- ============================================================
-- 09 · v5_importar_especies
-- Importador por lotes de la base de especies (datos/bitacora-especies.json).
-- Máximo 400 filas por llamada. Actualiza por nombre científico; inserta las nuevas.
-- ============================================================
create unique index if not exists especies_cientifico_uq on public.especies (lower(cientifico)) where tipo not in ('Lugar','Cultura');

create or replace function public.admin_importar_especies(p_key text, p_rows jsonb) returns jsonb
language plpgsql security definer set search_path to '' as $$
declare ins int; upd int;
begin
  perform private.require_admin(p_key);
  if jsonb_array_length(p_rows) > 400 then raise exception 'Máximo 400 filas por lote'; end if;
  with x as (
    select * from jsonb_to_recordset(p_rows) as x(o int, t text, f text, c text, n text, e text, r text, a text[], d text, i text, u text, s text)
    where coalesce(trim(c),'') <> '' and coalesce(trim(t),'') <> ''
  ), up as (
    update public.especies e set orden = x.o, tipo = x.t, familia = nullif(x.f,''), nombre = left(x.n,160), estado = nullif(x.e,''),
      rareza = coalesce(nullif(x.r,''),'comun'), anp = coalesce(x.a,'{}'),
      descripcion = coalesce(nullif(x.d,''), e.descripcion), importancia = coalesce(nullif(x.i,''), e.importancia),
      funcion = nullif(x.u,''), cita = nullif(x.s,'')
    from x where lower(e.cientifico) = lower(x.c) and e.tipo not in ('Lugar','Cultura')
    returning e.id
  ), nw as (
    insert into public.especies(orden, tipo, familia, cientifico, nombre, estado, rareza, anp, descripcion, importancia, funcion, cita, publicado, nivel)
    select x.o, x.t, nullif(x.f,''), x.c, left(x.n,160), nullif(x.e,''), coalesce(nullif(x.r,''),'comun'), coalesce(x.a,'{}'), nullif(x.d,''), nullif(x.i,''), nullif(x.u,''), nullif(x.s,''), true, 0
    from x where not exists (select 1 from public.especies e where lower(e.cientifico) = lower(x.c) and e.tipo not in ('Lugar','Cultura'))
    returning id
  ) select (select count(*) from nw), (select count(*) from up) into ins, upd;
  return jsonb_build_object('nuevas', ins, 'actualizadas', upd);
end $$;
