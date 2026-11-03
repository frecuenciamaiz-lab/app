-- ================================================================
-- PROYECTO MAÍZ · BASE DE DATOS COMPLETA EN UN SOLO ARCHIVO
-- ================================================================
-- Recrea exactamente la base de datos de Supabase del proyecto.
-- Ejecútelo COMPLETO, de una sola vez, en el SQL Editor de un
-- proyecto de Supabase RECIÉN CREADO (vacío).
--
-- Son las 9 migraciones en orden + la configuración del sitio.
-- Tarda unos segundos. Al terminar debe decir "Success".
--
-- ANTES DE EJECUTAR, cambie si hace falta:
--   1. La clave del panel: busque  maiz-4su7-90o5
--   2. El dominio de los avisos: busque  estudio-maiz.vercel.app
--   3. El id del proyecto: busque  pgwhbrkvwzticuewxwen
--      (lo ve en la URL de su proyecto nuevo en Supabase)
--
-- DESPUÉS de ejecutarlo faltan 3 cosas que NO se hacen con SQL:
--   A. Storage → New bucket → nombre: media → marcar "Public bucket"
--   B. Edge Functions → Deploy new function → nombre: admin-upload
--      (el código está en supabase/edge-functions/admin-upload/index.ts)
--      y en sus ajustes DESACTIVAR "Verify JWT"
--   C. Database → Extensions → activar pg_net (si no se activó solo)
-- ================================================================



-- ============================================================
-- 01 · brief_audiovisual
-- Tabla de briefs del formulario público + clave de administración (versión inicial).
-- NOTA: las funciones listar_briefs() y cambiar_estado() de esta migración quedaron
-- obsoletas en la migración 02 (se usan admin_list_briefs / admin_set_estado).
-- ============================================================
create extension if not exists pgcrypto with schema extensions;

create table public.briefs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nombre text not null check (char_length(nombre) between 1 and 150),
  responsable text not null check (char_length(responsable) <= 150),
  whatsapp text not null check (char_length(whatsapp) <= 30),
  ubicacion text not null check (char_length(ubicacion) <= 300),
  anios text,
  horario text check (char_length(horario) <= 200),
  mujeres int check (mujeres between 0 and 10000),
  hombres int check (hombres between 0 and 10000),
  edades text[],
  redes text check (char_length(redes) <= 500),
  tipo text not null,
  rubro jsonb not null default '{}'::jsonb,
  practicas text[],
  ejemplo_ec text check (char_length(ejemplo_ec) <= 2000),
  historia text check (char_length(historia) <= 3000),
  slogan text check (char_length(slogan) <= 200),
  objetivo text,
  producto text check (char_length(producto) <= 300),
  publico text check (char_length(publico) <= 1000),
  material text check (char_length(material) <= 500),
  grabacion text check (char_length(grabacion) <= 300),
  estado text not null default 'nuevo'
);

alter table public.briefs enable row level security;

create policy "cualquiera puede enviar un brief"
  on public.briefs for insert to anon, authenticated
  with check (estado = 'nuevo');

-- clave de administración (solo hash)
create schema if not exists private;
create table private.admin_key (id int primary key default 1, key_hash text not null);
insert into private.admin_key (key_hash) values (extensions.crypt('maiz-4su7-90o5', extensions.gen_salt('bf')));
revoke all on schema private from anon, authenticated;

create or replace function public.listar_briefs(p_clave text)
returns setof public.briefs
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (select 1 from private.admin_key k where k.key_hash = extensions.crypt(p_clave, k.key_hash)) then
    raise exception 'clave incorrecta';
  end if;
  return query select * from public.briefs order by created_at desc;
end $$;

create or replace function public.cambiar_estado(p_clave text, p_id uuid, p_estado text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (select 1 from private.admin_key k where k.key_hash = extensions.crypt(p_clave, k.key_hash)) then
    raise exception 'clave incorrecta';
  end if;
  if p_estado not in ('nuevo','revisado','agendado','grabado') then raise exception 'estado inválido'; end if;
  update public.briefs set estado = p_estado where id = p_id;
end $$;

revoke all on function public.listar_briefs(text) from public;
revoke all on function public.cambiar_estado(text, uuid, text) from public;
grant execute on function public.listar_briefs(text) to anon, authenticated;
grant execute on function public.cambiar_estado(text, uuid, text) to anon, authenticated;


-- ============================================================
-- 02 · panel_admin_fichas
-- Claves de administración con hash (private.admin_keys) y funciones del panel.
-- IMPORTANTE: cambie 'maiz-4su7-90o5' por la clave real antes de ejecutar.
-- ============================================================
create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.admin_keys (
  id serial primary key,
  label text not null,
  key_hash text not null,
  created_at timestamptz not null default now()
);

insert into private.admin_keys (label, key_hash)
values ('Karla', extensions.crypt('maiz-4su7-90o5', extensions.gen_salt('bf')));

create or replace function private.is_admin(p_key text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from private.admin_keys k
    where k.key_hash = extensions.crypt(p_key, k.key_hash)
  );
$$;

create or replace function public.admin_list_briefs(p_key text)
returns setof public.briefs
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_key is null or not private.is_admin(p_key) then
    raise exception 'clave incorrecta' using errcode = '28000';
  end if;
  return query select * from public.briefs order by created_at desc;
end;
$$;

create or replace function public.admin_set_estado(p_key text, p_id uuid, p_estado text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_key is null or not private.is_admin(p_key) then
    raise exception 'clave incorrecta' using errcode = '28000';
  end if;
  if p_estado not in ('nuevo','revisado','agendado','grabado') then
    raise exception 'estado no válido';
  end if;
  update public.briefs set estado = p_estado where id = p_id;
end;
$$;

revoke all on function public.admin_list_briefs(text) from public;
revoke all on function public.admin_set_estado(text, uuid, text) from public;
grant execute on function public.admin_list_briefs(text) to anon, authenticated;
grant execute on function public.admin_set_estado(text, uuid, text) to anon, authenticated;
revoke all on function private.is_admin(text) from public, anon, authenticated;

-- límites básicos de tamaño para evitar abuso del formulario público
alter table public.briefs
  add constraint briefs_largos check (
    length(nombre) <= 200 and length(responsable) <= 200 and length(whatsapp) <= 40
    and length(coalesce(historia,'')) <= 4000 and length(coalesce(ejemplo_ec,'')) <= 4000
    and length(rubro::text) <= 6000
  );


-- ============================================================
-- 03 · solicitudes_proyecto_maiz
-- Solicitudes de servicios de las tres unidades (estudio, radio, ruta).
-- ============================================================
create table public.solicitudes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  unidad text not null check (unidad in ('estudio','radio','ruta')),
  tipo text not null check (char_length(tipo) between 1 and 60),
  paquete text check (char_length(paquete) <= 120),
  nombre text not null check (char_length(nombre) between 1 and 150),
  contacto text check (char_length(contacto) <= 150),
  whatsapp text check (char_length(whatsapp) <= 30),
  correo text check (char_length(correo) <= 150),
  datos jsonb not null default '{}'::jsonb check (pg_column_size(datos) <= 20000),
  estado text not null default 'recibido' check (estado in ('recibido','en_revision','cotizacion_enviada','aceptado','finalizado','descartado'))
);
alter table public.solicitudes enable row level security;
create policy "cualquiera puede enviar una solicitud" on public.solicitudes
  for insert to anon, authenticated with check (estado = 'recibido');
grant insert on public.solicitudes to anon, authenticated;

create or replace function public.admin_list_solicitudes(p_key text)
returns setof public.solicitudes language plpgsql security definer set search_path to '' as $$
begin
  if p_key is null or not private.is_admin(p_key) then
    raise exception 'clave incorrecta' using errcode = '28000';
  end if;
  return query select * from public.solicitudes order by created_at desc;
end; $$;

create or replace function public.admin_set_estado_solicitud(p_key text, p_id uuid, p_estado text)
returns void language plpgsql security definer set search_path to '' as $$
begin
  if p_key is null or not private.is_admin(p_key) then
    raise exception 'clave incorrecta' using errcode = '28000';
  end if;
  if p_estado not in ('recibido','en_revision','cotizacion_enviada','aceptado','finalizado','descartado') then
    raise exception 'estado no válido';
  end if;
  update public.solicitudes set estado = p_estado where id = p_id;
end; $$;
revoke all on function public.admin_list_solicitudes(text) from public;
revoke all on function public.admin_set_estado_solicitud(text,uuid,text) from public;
grant execute on function public.admin_list_solicitudes(text) to anon, authenticated;
grant execute on function public.admin_set_estado_solicitud(text,uuid,text) to anon, authenticated;


-- ============================================================
-- 04 · v3_plataforma_completa
-- Briefs ampliados, configuración del sitio, estadísticas, Ruta Maíz y portafolio.
-- ============================================================

-- 1) Briefs: nuevos campos
alter table public.briefs
  add column if not exists maps_url text,
  add column if not exists lat double precision,
  add column if not exists lng double precision,
  add column if not exists redes_lista jsonb default '[]'::jsonb,
  add column if not exists idea text,
  add column if not exists disponibilidad jsonb default '[]'::jsonb,
  add column if not exists fecha_grabacion timestamptz,
  add column if not exists notas text;

alter table public.briefs drop constraint if exists briefs_v3_len;
alter table public.briefs add constraint briefs_v3_len check (
  coalesce(length(maps_url),0) <= 600 and coalesce(length(idea),0) <= 3000
  and coalesce(length(notas),0) <= 5000
  and pg_column_size(coalesce(redes_lista,'[]'::jsonb)) <= 4000
  and pg_column_size(coalesce(disponibilidad,'[]'::jsonb)) <= 4000
  and (lat is null or lat between -90 and 90) and (lng is null or lng between -180 and 180)
);

-- 2) Configuración pública del sitio (textos, colores, equipo, redes)
create table if not exists public.site_config (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);
alter table public.site_config enable row level security;
drop policy if exists "config publica" on public.site_config;
create policy "config publica" on public.site_config for select to anon, authenticated using (true);
insert into public.site_config (id, data) values (1, '{}'::jsonb) on conflict do nothing;

-- 3) Visitas (estadísticas propias)
create table if not exists public.visitas (
  id bigserial primary key,
  created_at timestamptz default now(),
  path text check (length(path) <= 200),
  ref text check (length(ref) <= 300),
  device text check (device in ('movil','tablet','computadora')),
  sid text check (length(sid) <= 40),
  evento text default 'vista' check (evento in ('vista','whatsapp','brief_inicio','brief_envio','solicitud','ruta_ver'))
);
alter table public.visitas enable row level security;
drop policy if exists "registrar visita" on public.visitas;
create policy "registrar visita" on public.visitas for insert to anon, authenticated with check (true);
create index if not exists visitas_created_idx on public.visitas (created_at);

-- 4) Ruta Maíz
create table if not exists public.ruta_locales (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  nombre text not null check (length(nombre) <= 120),
  categoria text check (length(categoria) <= 60),
  municipio text check (length(municipio) <= 80),
  lat double precision, lng double precision,
  descripcion text check (length(descripcion) <= 1500),
  pros text[] default '{}', contras text[] default '{}',
  consumo text check (length(consumo) <= 80),
  precio_nivel int default 2 check (precio_nivel between 1 and 4),
  horario text check (length(horario) <= 200),
  menu_url text check (length(menu_url) <= 600),
  menu jsonb default '[]'::jsonb,
  servicios text[] default '{}',
  practicas text[] default '{}',
  promo text check (length(promo) <= 300),
  foto_url text check (length(foto_url) <= 600),
  whatsapp text check (length(whatsapp) <= 30),
  plan text default 'basico' check (plan in ('basico','destacado','aliado')),
  ejemplo boolean default false,
  publicado boolean default false
);
alter table public.ruta_locales enable row level security;
drop policy if exists "locales publicados" on public.ruta_locales;
create policy "locales publicados" on public.ruta_locales for select to anon, authenticated using (publicado);

create table if not exists public.ruta_rutas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  nombre text not null check (length(nombre) <= 120),
  descripcion text check (length(descripcion) <= 1000),
  duracion text check (length(duracion) <= 60),
  tema text check (length(tema) <= 60),
  locales uuid[] default '{}',
  publicado boolean default false
);
alter table public.ruta_rutas enable row level security;
drop policy if exists "rutas publicadas" on public.ruta_rutas;
create policy "rutas publicadas" on public.ruta_rutas for select to anon, authenticated using (publicado);

-- 5) Portafolio
create table if not exists public.portafolio (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  titulo text not null check (length(titulo) <= 140),
  cliente text check (length(cliente) <= 120),
  rubro text check (length(rubro) <= 60),
  descripcion text check (length(descripcion) <= 800),
  video_url text check (length(video_url) <= 600),
  poster_url text check (length(poster_url) <= 600),
  red_url text check (length(red_url) <= 600),
  orden int default 0,
  publicado boolean default true
);
alter table public.portafolio enable row level security;
drop policy if exists "portafolio publico" on public.portafolio;
create policy "portafolio publico" on public.portafolio for select to anon, authenticated using (publicado);

-- 6) Funciones de administración (todas con clave)
create or replace function public.admin_check(p_key text) returns boolean
language sql security definer set search_path to '' as $$ select coalesce(private.is_admin(p_key), false) $$;

create or replace function private.require_admin(p_key text) returns void
language plpgsql security definer set search_path to '' as $$
begin
  if p_key is null or not private.is_admin(p_key) then
    raise exception 'clave incorrecta' using errcode = '28000';
  end if;
end $$;

create or replace function public.admin_update_brief(p_key text, p_id uuid, p_fecha timestamptz, p_notas text, p_set_fecha boolean default true)
returns void language plpgsql security definer set search_path to '' as $$
begin
  perform private.require_admin(p_key);
  update public.briefs set
    fecha_grabacion = case when p_set_fecha then p_fecha else fecha_grabacion end,
    notas = coalesce(p_notas, notas)
  where id = p_id;
end $$;

create or replace function public.admin_set_config(p_key text, p_data jsonb)
returns void language plpgsql security definer set search_path to '' as $$
begin
  perform private.require_admin(p_key);
  if pg_column_size(p_data) > 200000 then raise exception 'configuración demasiado grande'; end if;
  update public.site_config set data = p_data, updated_at = now() where id = 1;
end $$;

-- Ruta Maíz admin
create or replace function public.admin_list_locales(p_key text) returns setof public.ruta_locales
language plpgsql security definer set search_path to '' as $$
begin perform private.require_admin(p_key); return query select * from public.ruta_locales order by created_at desc; end $$;

create or replace function public.admin_upsert_local(p_key text, p_row jsonb) returns uuid
language plpgsql security definer set search_path to '' as $$
declare v_id uuid;
begin
  perform private.require_admin(p_key);
  v_id := nullif(p_row->>'id','')::uuid;
  if v_id is null then
    insert into public.ruta_locales (nombre) values (coalesce(p_row->>'nombre','Sin nombre')) returning id into v_id;
  end if;
  update public.ruta_locales t set
    nombre = coalesce(p_row->>'nombre', t.nombre),
    categoria = p_row->>'categoria', municipio = p_row->>'municipio',
    lat = nullif(p_row->>'lat','')::double precision, lng = nullif(p_row->>'lng','')::double precision,
    descripcion = p_row->>'descripcion',
    pros = coalesce((select array_agg(value) from jsonb_array_elements_text(coalesce(p_row->'pros','[]'))), '{}'),
    contras = coalesce((select array_agg(value) from jsonb_array_elements_text(coalesce(p_row->'contras','[]'))), '{}'),
    servicios = coalesce((select array_agg(value) from jsonb_array_elements_text(coalesce(p_row->'servicios','[]'))), '{}'),
    practicas = coalesce((select array_agg(value) from jsonb_array_elements_text(coalesce(p_row->'practicas','[]'))), '{}'),
    consumo = p_row->>'consumo', precio_nivel = coalesce(nullif(p_row->>'precio_nivel','')::int, 2),
    horario = p_row->>'horario', menu_url = p_row->>'menu_url', menu = coalesce(p_row->'menu','[]'),
    promo = p_row->>'promo', foto_url = p_row->>'foto_url', whatsapp = p_row->>'whatsapp',
    plan = coalesce(nullif(p_row->>'plan',''),'basico'),
    ejemplo = coalesce((p_row->>'ejemplo')::boolean, false),
    publicado = coalesce((p_row->>'publicado')::boolean, false)
  where t.id = v_id;
  return v_id;
end $$;

create or replace function public.admin_delete_local(p_key text, p_id uuid) returns void
language plpgsql security definer set search_path to '' as $$
begin perform private.require_admin(p_key); delete from public.ruta_locales where id = p_id; end $$;

create or replace function public.admin_list_rutas(p_key text) returns setof public.ruta_rutas
language plpgsql security definer set search_path to '' as $$
begin perform private.require_admin(p_key); return query select * from public.ruta_rutas order by created_at desc; end $$;

create or replace function public.admin_upsert_ruta(p_key text, p_row jsonb) returns uuid
language plpgsql security definer set search_path to '' as $$
declare v_id uuid;
begin
  perform private.require_admin(p_key);
  v_id := nullif(p_row->>'id','')::uuid;
  if v_id is null then
    insert into public.ruta_rutas (nombre) values (coalesce(p_row->>'nombre','Ruta')) returning id into v_id;
  end if;
  update public.ruta_rutas t set
    nombre = coalesce(p_row->>'nombre', t.nombre), descripcion = p_row->>'descripcion',
    duracion = p_row->>'duracion', tema = p_row->>'tema',
    locales = coalesce((select array_agg(value::uuid) from jsonb_array_elements_text(coalesce(p_row->'locales','[]'))), '{}'),
    publicado = coalesce((p_row->>'publicado')::boolean, false)
  where t.id = v_id;
  return v_id;
end $$;

create or replace function public.admin_delete_ruta(p_key text, p_id uuid) returns void
language plpgsql security definer set search_path to '' as $$
begin perform private.require_admin(p_key); delete from public.ruta_rutas where id = p_id; end $$;

-- Portafolio admin
create or replace function public.admin_list_portafolio(p_key text) returns setof public.portafolio
language plpgsql security definer set search_path to '' as $$
begin perform private.require_admin(p_key); return query select * from public.portafolio order by orden, created_at desc; end $$;

create or replace function public.admin_upsert_portafolio(p_key text, p_row jsonb) returns uuid
language plpgsql security definer set search_path to '' as $$
declare v_id uuid;
begin
  perform private.require_admin(p_key);
  v_id := nullif(p_row->>'id','')::uuid;
  if v_id is null then
    insert into public.portafolio (titulo) values (coalesce(p_row->>'titulo','Proyecto')) returning id into v_id;
  end if;
  update public.portafolio t set
    titulo = coalesce(p_row->>'titulo', t.titulo), cliente = p_row->>'cliente', rubro = p_row->>'rubro',
    descripcion = p_row->>'descripcion', video_url = p_row->>'video_url', poster_url = p_row->>'poster_url',
    red_url = p_row->>'red_url', orden = coalesce(nullif(p_row->>'orden','')::int, 0),
    publicado = coalesce((p_row->>'publicado')::boolean, true)
  where t.id = v_id;
  return v_id;
end $$;

create or replace function public.admin_delete_portafolio(p_key text, p_id uuid) returns void
language plpgsql security definer set search_path to '' as $$
begin perform private.require_admin(p_key); delete from public.portafolio where id = p_id; end $$;

-- Permisos: funciones privadas no ejecutables por el público
revoke all on function private.require_admin(text) from public, anon, authenticated;
grant usage on schema private to anon, authenticated;
grant execute on function private.require_admin(text) to anon, authenticated;

-- (admin_stats se define en la migración 05, con la versión corregida del GROUP BY)


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


-- ============================================================
-- 06 · v4_radio_avisos_negocios_pokedex
-- Radio, avisos por WhatsApp (CallMeBot), perfiles de negocio con PIN y primera Pokédex.
-- NOTA: negocio_get / negocio_update y check_pin se reemplazan en la migración 07.
-- ============================================================
create extension if not exists pg_net;

-- Fotos del brief y horario estructurado
alter table public.briefs add column if not exists fotos jsonb default '[]'::jsonb,
  add column if not exists horario_json jsonb;
alter table public.briefs drop constraint if exists briefs_v4_len;
alter table public.briefs add constraint briefs_v4_len check (pg_column_size(coalesce(fotos,'[]'::jsonb)) <= 6000 and pg_column_size(coalesce(horario_json,'{}'::jsonb)) <= 2000);

-- ===== Radio =====
create table if not exists public.radio_tracks (
  id uuid primary key default gen_random_uuid(), created_at timestamptz default now(),
  titulo text not null check (length(titulo) <= 140), artista text check (length(artista) <= 140),
  genero text check (length(genero) <= 60), duracion int default 180 check (duracion between 1 and 7200),
  audio_url text not null check (length(audio_url) <= 600), cover_url text check (length(cover_url) <= 600),
  licencia text check (length(licencia) <= 120), orden int default 0, en_vivo boolean default true, publicado boolean default true);
alter table public.radio_tracks enable row level security;
drop policy if exists "pistas publicas" on public.radio_tracks;
create policy "pistas publicas" on public.radio_tracks for select to anon, authenticated using (publicado);

create or replace function public.admin_list_tracks(p_key text) returns setof public.radio_tracks
language plpgsql security definer set search_path to '' as $$
begin perform private.require_admin(p_key); return query select * from public.radio_tracks order by orden, created_at; end $$;

create or replace function public.admin_upsert_track(p_key text, p_row jsonb) returns uuid
language plpgsql security definer set search_path to '' as $$
declare v uuid;
begin
  perform private.require_admin(p_key);
  v := nullif(p_row->>'id','')::uuid;
  if v is null then insert into public.radio_tracks (titulo, audio_url) values (coalesce(p_row->>'titulo','Pista'), p_row->>'audio_url') returning id into v; end if;
  update public.radio_tracks t set titulo = coalesce(p_row->>'titulo', t.titulo), artista = p_row->>'artista', genero = p_row->>'genero',
    duracion = coalesce(nullif(p_row->>'duracion','')::numeric::int, t.duracion), audio_url = coalesce(nullif(p_row->>'audio_url',''), t.audio_url),
    cover_url = p_row->>'cover_url', licencia = p_row->>'licencia', orden = coalesce(nullif(p_row->>'orden','')::int, 0),
    en_vivo = coalesce((p_row->>'en_vivo')::boolean, true), publicado = coalesce((p_row->>'publicado')::boolean, true)
  where t.id = v;
  return v;
end $$;

create or replace function public.admin_delete_track(p_key text, p_id uuid) returns void
language plpgsql security definer set search_path to '' as $$
begin perform private.require_admin(p_key); delete from public.radio_tracks where id = p_id; end $$;

-- ===== Avisos por WhatsApp (CallMeBot) =====
create table if not exists private.avisos (id int primary key default 1 check (id = 1), activo boolean default false,
  telefono text, apikey text, cada int default 1, pendientes int default 0, ultimo_error text, actualizado timestamptz);
insert into private.avisos (id) values (1) on conflict do nothing;

create or replace function public.admin_get_avisos(p_key text) returns jsonb
language plpgsql security definer set search_path to '' as $$
declare r private.avisos;
begin perform private.require_admin(p_key); select * into r from private.avisos where id = 1;
  return jsonb_build_object('activo', r.activo, 'telefono', r.telefono, 'tiene_apikey', r.apikey is not null and r.apikey <> '', 'cada', r.cada, 'pendientes', r.pendientes); end $$;

create or replace function public.admin_set_avisos(p_key text, p_activo boolean, p_telefono text, p_apikey text, p_cada int)
returns void language plpgsql security definer set search_path to '' as $$
begin perform private.require_admin(p_key);
  update private.avisos set activo = p_activo, telefono = regexp_replace(coalesce(p_telefono,''), '[^0-9+]', '', 'g'),
    apikey = case when coalesce(p_apikey,'') = '' then apikey else p_apikey end, cada = greatest(1, least(coalesce(p_cada,1), 50)), actualizado = now() where id = 1; end $$;

create or replace function private.enviar_whatsapp(p_texto text) returns void
language plpgsql security definer set search_path to '' as $$
declare a private.avisos;
begin
  select * into a from private.avisos where id = 1;
  if not a.activo or coalesce(a.apikey,'') = '' or coalesce(a.telefono,'') = '' then return; end if;
  perform net.http_get(
    url := 'https://api.callmebot.com/whatsapp.php?phone=' || a.telefono || '&apikey=' || a.apikey || '&text=' || replace(replace(replace(replace(replace(p_texto, '%', '%25'), ' ', '%20'), E'\n', '%0A'), '&', '%26'), '#', '%23'));
end $$;

create or replace function public.admin_test_aviso(p_key text) returns void
language plpgsql security definer set search_path to '' as $$
begin perform private.require_admin(p_key); perform private.enviar_whatsapp('🌽 Prueba de avisos de Proyecto Maíz: ¡funciona!'); end $$;

-- OJO: cambie estudio-maiz.vercel.app por el dominio del nuevo despliegue.
create or replace function private.notificar() returns trigger
language plpgsql security definer set search_path to '' as $$
declare a private.avisos; txt text; w text;
begin
  select * into a from private.avisos where id = 1;
  if not a.activo then return new; end if;
  update private.avisos set pendientes = pendientes + 1 where id = 1 returning * into a;
  if a.pendientes < a.cada then return new; end if;
  update private.avisos set pendientes = 0 where id = 1;
  w := regexp_replace(coalesce(new.whatsapp,''), '\D', '', 'g'); if length(w) = 8 then w := '503' || w; end if;
  if TG_TABLE_NAME = 'briefs' then
    txt := '🌽 *Nueva ficha de Estudio Maíz*' || E'\n' || 'Negocio: ' || coalesce(new.nombre,'') || E'\n' || 'Responsable: ' || coalesce(new.responsable,'') ||
      E'\n' || 'Rubro: ' || coalesce(new.tipo,'') || E'\n' || 'Fechas: ' || coalesce(new.grabacion,'') ||
      E'\n' || 'Escribirle: https://wa.me/' || w || E'\n' || 'Ver ficha: https://estudio-maiz.vercel.app/panel#ficha/' || new.id;
  else
    txt := '🌽 *Nueva solicitud (' || coalesce(new.unidad,'') || ')*' || E'\n' || coalesce(new.tipo,'') || coalesce(' · ' || new.paquete,'') ||
      E'\n' || 'Nombre: ' || coalesce(new.nombre,'') || E'\n' || 'Escribirle: https://wa.me/' || w || E'\n' || 'Panel: https://estudio-maiz.vercel.app/panel#solicitudes';
  end if;
  if a.cada > 1 then txt := txt || E'\n' || '(Aviso cada ' || a.cada || ' envíos; revise el panel para ver todos)'; end if;
  perform private.enviar_whatsapp(txt);
  return new;
exception when others then return new;
end $$;
drop trigger if exists aviso_brief on public.briefs;
create trigger aviso_brief after insert on public.briefs for each row execute function private.notificar();
drop trigger if exists aviso_solicitud on public.solicitudes;
create trigger aviso_solicitud after insert on public.solicitudes for each row execute function private.notificar();

-- ===== Perfiles de negocio (Ruta Maíz) =====
alter table public.ruta_locales
  add column if not exists wifi_ssid text check (length(wifi_ssid) <= 64),
  add column if not exists wifi_pass text check (length(wifi_pass) <= 64),
  add column if not exists departamento text check (length(departamento) <= 40),
  add column if not exists pendiente jsonb,
  add column if not exists actualizado timestamptz;
create table if not exists private.local_pins (local_id uuid primary key references public.ruta_locales(id) on delete cascade, pin_hash text not null);

create or replace function public.admin_set_pin_local(p_key text, p_id uuid, p_pin text) returns void
language plpgsql security definer set search_path to '' as $$
begin perform private.require_admin(p_key);
  if length(coalesce(p_pin,'')) < 4 then raise exception 'PIN muy corto'; end if;
  insert into private.local_pins values (p_id, extensions.crypt(p_pin, extensions.gen_salt('bf')))
  on conflict (local_id) do update set pin_hash = excluded.pin_hash; end $$;

create or replace function public.admin_revisar_local(p_key text, p_id uuid, p_aprobar boolean) returns void
language plpgsql security definer set search_path to '' as $$
declare p jsonb;
begin perform private.require_admin(p_key);
  select pendiente into p from public.ruta_locales where id = p_id;
  if p_aprobar and p is not null then
    update public.ruta_locales set promo = coalesce(p->>'promo', promo), foto_url = coalesce(p->>'foto_url', foto_url),
      descripcion = coalesce(p->>'descripcion', descripcion) where id = p_id;
  end if;
  update public.ruta_locales set pendiente = null where id = p_id; end $$;

create or replace function public.admin_set_local_extra(p_key text, p_id uuid, p_row jsonb) returns void
language plpgsql security definer set search_path to '' as $$
begin perform private.require_admin(p_key);
  update public.ruta_locales set wifi_ssid = p_row->>'wifi_ssid', wifi_pass = p_row->>'wifi_pass', departamento = p_row->>'departamento' where id = p_id; end $$;

-- ===== Pokédex de la reserva (versión inicial; se amplía en la migración 08) =====
create table if not exists public.especies (
  id uuid primary key default gen_random_uuid(), created_at timestamptz default now(),
  nombre text not null check (length(nombre) <= 120), cientifico text check (length(cientifico) <= 120),
  tipo text check (tipo in ('Ave','Mamífero','Reptil','Anfibio','Insecto','Planta','Árbol','Hongo','Lugar','Cultura')),
  descripcion text check (length(descripcion) <= 1500), dato text check (length(dato) <= 400),
  zona text check (length(zona) <= 120), nivel int default 0 check (nivel between 0 and 20),
  estado text check (length(estado) <= 60), imagen_url text check (length(imagen_url) <= 600), emoji text check (length(emoji) <= 16),
  publicado boolean default true);
alter table public.especies enable row level security;
drop policy if exists "especies publicas" on public.especies;
create policy "especies publicas" on public.especies for select to anon, authenticated using (publicado);

create or replace function public.admin_delete_especie(p_key text, p_id uuid) returns void
language plpgsql security definer set search_path to '' as $$
begin perform private.require_admin(p_key); delete from public.especies where id = p_id; end $$;


-- ============================================================
-- 07 · v4_pin_bloqueo + v4_negocio_update_bloqueo
-- Bloqueo tras 5 intentos fallidos de PIN y versiones finales de negocio_get / negocio_update.
-- OJO: en negocio_update hay una validación con la URL del proyecto de Supabase.
--      Cambie pgwhbrkvwzticuewxwen por el id del NUEVO proyecto.
-- ============================================================
create table if not exists private.pin_intentos(local_id uuid primary key, fallos int not null default 0, hasta timestamptz);

create or replace function private.pin_ok(p_id uuid, p_pin text) returns boolean
language plpgsql security definer set search_path to '' as $$
declare i private.pin_intentos; ok boolean;
begin
  select * into i from private.pin_intentos where local_id = p_id;
  if i.hasta is not null and i.hasta > now() then return null; end if;
  ok := exists (select 1 from private.local_pins where local_id = p_id and pin_hash = extensions.crypt(coalesce(p_pin,''), pin_hash));
  if ok then delete from private.pin_intentos where local_id = p_id; return true; end if;
  insert into private.pin_intentos(local_id, fallos) values (p_id, 1)
    on conflict (local_id) do update set fallos = case when private.pin_intentos.hasta is not null and private.pin_intentos.hasta <= now() then 1 else private.pin_intentos.fallos + 1 end,
      hasta = case when (case when private.pin_intentos.hasta is not null and private.pin_intentos.hasta <= now() then 1 else private.pin_intentos.fallos + 1 end) >= 5 then now() + interval '15 minutes' else null end;
  return false;
end $$;

create or replace function private.check_pin(p_id uuid, p_pin text) returns void
language plpgsql security definer set search_path to '' as $$
begin
  if exists (select 1 from private.pin_intentos where local_id = p_id and hasta > now()) then raise exception 'Demasiados intentos. Espere 15 minutos.' using errcode = '28000'; end if;
  if not exists (select 1 from private.local_pins where local_id = p_id and pin_hash = extensions.crypt(coalesce(p_pin,''), pin_hash)) then
    raise exception 'PIN incorrecto' using errcode = '28000'; end if;
end $$;

drop function if exists public.negocio_get(uuid, text);
create function public.negocio_get(p_id uuid, p_pin text) returns jsonb
language plpgsql security definer set search_path to '' as $$
declare ok boolean; r jsonb;
begin
  ok := private.pin_ok(p_id, p_pin);
  if ok is null then return jsonb_build_object('error', 'bloqueado'); end if;
  if not ok then return jsonb_build_object('error', 'pin'); end if;
  select to_jsonb(t) - 'plan' into r from public.ruta_locales t where id = p_id;
  return jsonb_build_object('local', r);
end $$;
grant execute on function public.negocio_get(uuid, text) to anon, authenticated;

create or replace function private.ad_set_pin_reset() returns trigger language plpgsql security definer set search_path to '' as $$
begin delete from private.pin_intentos where local_id = new.local_id; return new; end $$;
drop trigger if exists pin_reset on private.local_pins;
create trigger pin_reset after insert or update on private.local_pins for each row execute function private.ad_set_pin_reset();

drop function if exists public.negocio_update(uuid, text, jsonb);
create function public.negocio_update(p_id uuid, p_pin text, p_row jsonb) returns jsonb
language plpgsql security definer set search_path to '' as $$
declare pend jsonb := '{}'::jsonb; ok boolean;
begin
  ok := private.pin_ok(p_id, p_pin);
  if ok is null then return jsonb_build_object('error','bloqueado'); end if;
  if not ok then return jsonb_build_object('error','pin'); end if;
  update public.ruta_locales t set
    consumo = left(coalesce(p_row->>'consumo', t.consumo), 80),
    horario = left(coalesce(p_row->>'horario', t.horario), 200),
    menu_url = left(coalesce(p_row->>'menu_url', t.menu_url), 600),
    menu = case when p_row ? 'menu' and pg_column_size(p_row->'menu') < 20000 then p_row->'menu' else t.menu end,
    wifi_ssid = left(coalesce(p_row->>'wifi_ssid', t.wifi_ssid), 64),
    wifi_pass = left(coalesce(p_row->>'wifi_pass', t.wifi_pass), 64),
    whatsapp = left(coalesce(p_row->>'whatsapp', t.whatsapp), 30),
    actualizado = now()
  where t.id = p_id;
  if p_row ? 'promo' then pend := pend || jsonb_build_object('promo', left(p_row->>'promo', 300)); end if;
  if p_row ? 'foto_url' and (p_row->>'foto_url') like 'https://pgwhbrkvwzticuewxwen.supabase.co/storage/v1/object/public/media/negocios/%' then pend := pend || jsonb_build_object('foto_url', left(p_row->>'foto_url', 600)); end if;
  if p_row ? 'descripcion' then pend := pend || jsonb_build_object('descripcion', left(p_row->>'descripcion', 1500)); end if;
  if pend <> '{}'::jsonb then update public.ruta_locales set pendiente = coalesce(pendiente,'{}'::jsonb) || pend || jsonb_build_object('fecha', now()) where id = p_id; end if;
  return jsonb_build_object('ok', true, 'pendiente', pend <> '{}'::jsonb);
end $$;
grant execute on function public.negocio_update(uuid, text, jsonb) to anon, authenticated;


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


-- ============================================================
-- 10 · Configuración del sitio (marca, colores, equipo, mapa)
-- Es lo que se edita desde Panel → Sitio. Esto deja el sitio
-- nuevo idéntico al actual.
-- ============================================================
update public.site_config set data = $cfg${
  "mapa": {
    "googleKey": "AIzaSyBxpNShM0jqFa20y-4RN9Obk5xdulYh7W0",
    "proveedor": "osm",
    "limite3d": 4800
  },
  "marca": {
    "nombre": "Proyecto Maíz",
    "lema": "Comunicación, cultura y territorio desde el occidente de El Salvador.",
    "correo": "Frecuenciamaiz@gmail.com",
    "whatsapp": "50376365173",
    "whatsappTexto": "+503 7636 5173",
    "whatsappMensaje": "Hola, vengo de la página de Proyecto Maíz y quisiera información."
  },
  "redes": { "ruta": [], "estudio": [], "frecuencia": [] },
  "equipo": [
    { "nombre": "Karla Peña", "rol": "Frecuencia Maíz", "foto": "",
      "bio": "Licenciada en Ciencias Químicas con especialidad en Química Ambiental. Une la comunicación con la economía circular." },
    { "nombre": "Daniel Córdova", "rol": "Frecuencia Maíz", "foto": "",
      "bio": "Producción de contenido, radio y podcast." },
    { "nombre": "Ever Quiñónez", "rol": "Frecuencia Maíz", "foto": "", "bio": "" }
  ],
  "colores": {
    "acento": "#F4C230",
    "oscuro": "#3B2418",
    "verde": "#4F6B3A",
    "tierra": "#8A5A3B"
  },
  "portada": {
    "titulo": "Contamos la historia de tu negocio",
    "subtitulo": "Producimos videos, fotos y contenido para redes que muestran lo mejor de tu negocio y tu compromiso con la tierra.",
    "cta": "Cuéntanos de tu negocio y agendemos una cita",
    "ctaNota": "Toma unos 8 minutos. Te escribimos por WhatsApp para coordinar."
  },
  "unidades": {
    "estudio": { "titulo": "Estudio Maíz", "sub": "Agencia de contenido audiovisual" },
    "radio":   { "titulo": "Frecuencia Maíz", "sub": "Radio y diversas áreas creativas" },
    "ruta":    { "titulo": "Ruta Maíz", "sub": "Rutas, sabores y negocios locales" }
  }
}$cfg$::jsonb, updated_at = now() where id = 1;


-- ============================================================
-- 11 · Limpieza: funciones viejas que ya no usa el sitio
-- (quedaron de la primera versión y usaban otra clave)
-- ============================================================
drop function if exists public.listar_briefs(text);
drop function if exists public.cambiar_estado(text, uuid, text);
drop table if exists private.admin_key;


-- ============================================================
-- LISTO. Para comprobar que todo quedó bien, ejecute:
--   select public.admin_check('maiz-4su7-90o5');     -- debe dar true
--   select count(*) from public.especies;            -- debe dar 0 (aún sin importar)
-- ============================================================
