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
insert into private.admin_key (key_hash) values (extensions.crypt('CAMBIE-ESTA-CLAVE', extensions.gen_salt('bf')));
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
