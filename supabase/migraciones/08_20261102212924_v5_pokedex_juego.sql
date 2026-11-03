-- ============================================================
-- 08 · v5_pokedex_juego
-- Pokédex completa (familia, áreas protegidas, rareza, modelo 3D), avistamientos fijos,
-- juego con ranking y contador mensual de vistas 3D de Google.
-- ============================================================
alter table public.especies
  add column if not exists familia text,
  add column if not exists anp text[] not null default '{}',
  add column if not exists cita text,
  add column if not exists importancia text,
  add column if not exists funcion text,
  add column if not exists rareza text not null default 'comun',
  add column if not exists modelo_3d text,
  add column if not exists inat_id int,
  add column if not exists foto_credito text,
  add column if not exists orden int;
delete from public.especies where tipo not in ('Lugar','Cultura');
create index if not exists especies_orden on public.especies(orden);

create or replace function public.admin_list_especies(p_key text) returns setof public.especies
language plpgsql security definer set search_path to '' as $$
begin perform private.require_admin(p_key); return query select * from public.especies order by nivel, nombre; end $$;

create or replace function public.admin_upsert_especie(p_key text, p_row jsonb) returns uuid
language plpgsql security definer set search_path to '' as $$
declare v uuid;
begin
  perform private.require_admin(p_key);
  if p_row ? 'id' and (p_row->>'id') is not null then
    update public.especies t set
      nombre = coalesce(p_row->>'nombre', t.nombre), cientifico = coalesce(p_row->>'cientifico', t.cientifico), tipo = coalesce(p_row->>'tipo', t.tipo),
      descripcion = coalesce(p_row->>'descripcion', t.descripcion), dato = coalesce(p_row->>'dato', t.dato), zona = coalesce(p_row->>'zona', t.zona),
      nivel = coalesce((p_row->>'nivel')::int, t.nivel), estado = coalesce(p_row->>'estado', t.estado), imagen_url = case when p_row ? 'imagen_url' then p_row->>'imagen_url' else t.imagen_url end,
      emoji = coalesce(p_row->>'emoji', t.emoji), publicado = coalesce((p_row->>'publicado')::boolean, t.publicado), familia = coalesce(p_row->>'familia', t.familia),
      anp = case when p_row ? 'anp' then array(select jsonb_array_elements_text(p_row->'anp')) else t.anp end,
      cita = coalesce(p_row->>'cita', t.cita), importancia = coalesce(p_row->>'importancia', t.importancia), rareza = coalesce(p_row->>'rareza', t.rareza),
      modelo_3d = case when p_row ? 'modelo_3d' then nullif(p_row->>'modelo_3d','') else t.modelo_3d end,
      inat_id = coalesce((p_row->>'inat_id')::int, t.inat_id), foto_credito = coalesce(p_row->>'foto_credito', t.foto_credito)
    where id = (p_row->>'id')::uuid returning id into v;
  else
    insert into public.especies(nombre, cientifico, tipo, descripcion, dato, zona, nivel, estado, imagen_url, emoji, publicado, familia, anp, cita, importancia, rareza, modelo_3d, orden)
    values (p_row->>'nombre', p_row->>'cientifico', coalesce(p_row->>'tipo','Planta'), p_row->>'descripcion', p_row->>'dato', p_row->>'zona', coalesce((p_row->>'nivel')::int,0), p_row->>'estado',
      p_row->>'imagen_url', p_row->>'emoji', coalesce((p_row->>'publicado')::boolean,true), p_row->>'familia', coalesce(array(select jsonb_array_elements_text(p_row->'anp')),'{}'),
      p_row->>'cita', p_row->>'importancia', coalesce(p_row->>'rareza','comun'), nullif(p_row->>'modelo_3d',''), (select coalesce(max(orden),0)+1 from public.especies))
    returning id into v;
  end if;
  return v;
end $$;

-- fotos en lote (desde el panel, consultando iNaturalist)
create or replace function public.admin_set_fotos(p_key text, p_rows jsonb) returns int
language plpgsql security definer set search_path to '' as $$
declare n int;
begin
  perform private.require_admin(p_key);
  update public.especies t set imagen_url = left(x->>'imagen_url',600), inat_id = (x->>'inat_id')::int, foto_credito = left(x->>'foto_credito',200)
  from jsonb_array_elements(p_rows) x where t.id = (x->>'id')::uuid;
  get diagnostics n = row_count; return n;
end $$;

-- Avistamientos ubicados por el equipo (restaurantes, parques, miradores)
create table if not exists public.avistamientos(
  id uuid primary key default gen_random_uuid(), created_at timestamptz default now(),
  especie_id uuid references public.especies(id) on delete cascade, lat double precision not null, lng double precision not null,
  radio int not null default 80, nota text, activo boolean not null default true);
alter table public.avistamientos enable row level security;
create policy avist_pub on public.avistamientos for select using (activo);

create or replace function public.admin_list_avistamientos(p_key text) returns setof public.avistamientos language plpgsql security definer set search_path to '' as $$
begin perform private.require_admin(p_key); return query select * from public.avistamientos order by created_at desc; end $$;

create or replace function public.admin_upsert_avistamiento(p_key text, p_row jsonb) returns uuid language plpgsql security definer set search_path to '' as $$
declare v uuid; begin perform private.require_admin(p_key);
  if p_row ? 'id' then update public.avistamientos set especie_id=(p_row->>'especie_id')::uuid, lat=(p_row->>'lat')::float8, lng=(p_row->>'lng')::float8, radio=coalesce((p_row->>'radio')::int,80), nota=p_row->>'nota', activo=coalesce((p_row->>'activo')::boolean,true) where id=(p_row->>'id')::uuid returning id into v;
  else insert into public.avistamientos(especie_id,lat,lng,radio,nota) values ((p_row->>'especie_id')::uuid,(p_row->>'lat')::float8,(p_row->>'lng')::float8,coalesce((p_row->>'radio')::int,80),p_row->>'nota') returning id into v; end if; return v; end $$;

create or replace function public.admin_delete_avistamiento(p_key text, p_id uuid) returns void language plpgsql security definer set search_path to '' as $$
begin perform private.require_admin(p_key); delete from public.avistamientos where id=p_id; end $$;

-- Juego: jugadores y ranking (puntos calculados en el servidor)
create table if not exists public.jugadores(
  id uuid primary key, alias text not null, capturas uuid[] not null default '{}', puntos int not null default 0,
  creado timestamptz default now(), actualizado timestamptz default now());
alter table public.jugadores enable row level security; -- sin políticas: solo vía funciones

create or replace function public.juego_guardar(p_id uuid, p_alias text, p_capturas uuid[]) returns jsonb
language plpgsql security definer set search_path to '' as $$
declare j public.jugadores; nuevas uuid[]; pts int; alias text := left(regexp_replace(coalesce(p_alias,''),'[<>]','','g'),24);
begin
  if length(trim(alias)) < 2 then return jsonb_build_object('error','alias'); end if;
  select * into j from public.jugadores where id = p_id;
  if found and j.actualizado > now() - interval '15 seconds' then return jsonb_build_object('error','espere'); end if;
  nuevas := array(select distinct e.id from public.especies e where e.id = any(p_capturas));
  if found and coalesce(array_length(nuevas,1),0) - coalesce(array_length(j.capturas,1),0) > 40 then return jsonb_build_object('error','limite'); end if;
  select coalesce(sum(case rareza when 'legendaria' then 50 when 'rara' then 25 else 10 end),0) into pts from public.especies where id = any(nuevas);
  insert into public.jugadores(id, alias, capturas, puntos) values (p_id, alias, nuevas, pts)
    on conflict (id) do update set alias = excluded.alias, capturas = (select array(select distinct unnest(public.jugadores.capturas || excluded.capturas))),
      puntos = (select coalesce(sum(case rareza when 'legendaria' then 50 when 'rara' then 25 else 10 end),0) from public.especies where id = any(public.jugadores.capturas || excluded.capturas)),
      actualizado = now();
  return (select jsonb_build_object('ok',true,'puntos',puntos,'puesto',(select count(*)+1 from public.jugadores x where x.puntos > j2.puntos)) from public.jugadores j2 where id = p_id);
end $$;

create or replace function public.juego_ranking(p_limit int default 30) returns table(alias text, puntos int, especies int)
language sql security definer set search_path to '' as $$
  select alias, puntos, coalesce(array_length(capturas,1),0) from public.jugadores order by puntos desc, actualizado asc limit least(greatest(p_limit,1),100) $$;
grant execute on function public.juego_guardar(uuid,text,uuid[]), public.juego_ranking(int) to anon, authenticated;

-- Contador mensual de vistas 3D de Google (para cambiar al 3D gratuito al llegar al límite)
create table if not exists private.uso_mapas(mes text primary key, vistas3d int not null default 0);
create or replace function public.mapa3d_usar() returns jsonb language plpgsql security definer set search_path to '' as $$
declare m text := to_char(now() at time zone 'America/El_Salvador','YYYY-MM'); v int; lim int;
begin
  lim := coalesce(((select data from public.site_config where id=1)->'mapa'->>'limite3d')::int, 4800);
  insert into private.uso_mapas(mes,vistas3d) values (m,1) on conflict (mes) do update set vistas3d = private.uso_mapas.vistas3d + 1 returning vistas3d into v;
  return jsonb_build_object('vistas',v,'limite',lim,'google', v <= lim);
end $$;
grant execute on function public.mapa3d_usar() to anon, authenticated;
