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
