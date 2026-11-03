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
